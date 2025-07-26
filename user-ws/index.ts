import { WebSocketServer, WebSocket as WebSocketWsType } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const wss = new WebSocketServer({ port: 8080 });

interface Room {
    sockets: WebSocketWsType[];
    users: string[];
}

const RELAYER_URL = "ws://localhost:3001";
let relayerSocket: WebSocket | null = null;
const rooms: Record<string, Room> = {};
const socketToUsername = new Map<WebSocketWsType, string>();
const socketToRooms = new Map<WebSocketWsType, Set<string>>();

// Connect to relayer with robust reconnect logic
function connectToRelayer() {
    if (relayerSocket) relayerSocket.close();
    
    relayerSocket = new WebSocket(RELAYER_URL);
    
    relayerSocket.onopen = () => {
        console.log('✅ Connected to relayer');
    };
    
    relayerSocket.onerror = (error) => {
        console.error('❌ Relayer connection error:', error);
        setTimeout(connectToRelayer, 2000);
    };
    
    relayerSocket.onclose = () => {
        console.log('🔌 Relayer connection closed. Reconnecting...');
        setTimeout(connectToRelayer, 2000);
    };
    
relayerSocket.onmessage = async ({ data }) => {
  try {
    let text: string;

    if (typeof data === 'string') {
      text = data;
    } else if (data instanceof Buffer) {
      text = data.toString();
    } else if (data instanceof Blob) {
      text = await data.text(); // <- handle Blob from undici
    } else {
      console.warn('Unknown data type received from relayer:', typeof data);
      return;
    }

    const message = JSON.parse(text);
    console.log("📥 Relayer message received:", message);

    if (message.room) {
      const roomName = message.room.toLowerCase();
      const room = rooms[roomName];

      if (room) {
        // console.log(`📤 Broadcasting to ${room.sockets.length} users in ${roomName}`);
        broadcastToRoom(roomName, message);
      } else {
        console.log(`❌ Room ${roomName} not found for broadcasting`);
      }
    }

    if (message.type === 'room-created' && message.room) {
    const roomName = message.room.toLowerCase();
    // Ensure the room is created locally if not exists
  const isNewRoom = !rooms[roomName];
    getOrCreateRoom(roomName,false); // this will create room and broadcast room-list
    if (isNewRoom) {
    console.log(`🛠️ Room created from relayer: ${roomName}`);
    broadcastRoomList(); // <- 🔥 THIS IS WHAT WAS MISSING
  }
    }
  } catch (err) {
    console.error("❌ Error handling relayer message:", err);
  }
};
}

// Initialize connection
connectToRelayer();

// Get or create room with strict normalization
function getOrCreateRoom(roomName: string,shouldBroadcast = true): Room {
    const normalizedRoom = roomName.toLowerCase().trim();
    
    if (!rooms[normalizedRoom]) {
        rooms[normalizedRoom] = { sockets: [], users: [] };
        if (shouldBroadcast) broadcastRoomList();
        console.log(`🆕 Created room: ${normalizedRoom}`);
    }
    
    return rooms[normalizedRoom];
}

// Broadcast to room without modifying message
function broadcastToRoom(roomName: string, message: any) {
    const normalizedRoom = roomName.toLowerCase().trim();
    const room = rooms[normalizedRoom];
    
    if (!room) {
        console.log(`❌ Broadcast failed: Room ${normalizedRoom} not found`);
        return;
    }
    
    console.log(`📢 Broadcasting to ${room.sockets.length} users in ${normalizedRoom}:`, message);
    
    const messageString = JSON.stringify(message);
    room.sockets.forEach(socket => {
        if (socket.readyState === socket.OPEN) {
            const username = socketToUsername.get(socket) || 'unknown';
            console.log(`   → Sending to ${username}`);
            socket.send(messageString);
        } else {
            console.log(`   → Socket closed for ${socketToUsername.get(socket)}`);
        }
    });
}
//////////////////////new////////////
function broadcastRoomList() {
      const roomNames = Object.keys(rooms);
  const message = JSON.stringify({ type: 'room-list', rooms: roomNames, });

  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
    console.log(`[Server] Broadcasted room list: ${roomNames.join(', ')}`);
}
/////////////////

wss.on('connection', (ws) => {
    console.log('👤 New connection');
    socketToRooms.set(ws, new Set());
    
    ws.on('error', (error) => {
        console.error('❌ Connection error:', error);
    });

    ws.on('message', (data: string) => {
        try {
            console.log("📨 Received:", data);
            const message = JSON.parse(data);
            
            // Handle join-room messages
            if (message.type === "join-room" && message.room && message.sender) {
                const roomName = message.room.toLowerCase().trim();
                const username = message.sender;
                const isNewRoom = !rooms[roomName];//new
                const room = getOrCreateRoom(roomName,true);
                broadcastRoomList()//new
                
                //new
                if (isNewRoom && relayerSocket?.readyState === WebSocket.OPEN) {
                relayerSocket.send(JSON.stringify({
                    type: 'room-created',
                    room: roomName,
                    id: uuidv4(),
                }));
                }
                //new

                // Store user info
                socketToUsername.set(ws, username);
                socketToRooms.get(ws)?.add(roomName);
                
                // Add to room if new
                if (!room.users.includes(username)) {
                    room.users.push(username);
                    // console.log(`👋 ${username} joined ${roomName}`);
                }
                
                // Add socket if new
                if (!room.sockets.includes(ws)) {
                    room.sockets.push(ws);
                    // console.log(`➕ Socket added to ${roomName}`);
                }
                
                // Notify room about new user
                broadcastToRoom(roomName, {
                    type: 'user-joined',
                    sender: username,
                    room: roomName,
                    id: uuidv4()
                });
                
                // Send updated user list
                broadcastToRoom(roomName, {
                    type: 'room-users',
                    users: room.users,
                    room: roomName,
                    id: uuidv4()
                });
            }
            // Handle chat messages
            else if (message.type === 'chat' && message.room && message.sender) {
                const roomName = message.room.toLowerCase().trim();
                
                // Add unique ID if missing
                if (!message.id) message.id = uuidv4();
                
                // console.log(`💬 Chat message for ${roomName} from ${message.sender}`);
                
                // Forward to relayer
                if (relayerSocket?.readyState === WebSocket.OPEN) {
                    console.log("📤 Forwarding to relayer");
                    relayerSocket.send(JSON.stringify(message));
                } else {
                    console.log("❌ Relayer not connected, broadcasting locally");
                    broadcastToRoom(roomName, message);
                }
            }
        } catch (err) {
            console.error("❌ Message processing error:", err);
        }
    });

    ws.on('close', () => {
        console.log('👋 Connection closed');
        const username = socketToUsername.get(ws);
        
        if (username) {
            const userRooms = Array.from(socketToRooms.get(ws) || []);
            
            userRooms.forEach(roomName => {
                const room = rooms[roomName];
                if (!room) return;
                
                // Remove user
                const userIndex = room.users.indexOf(username);
                if (userIndex !== -1) {
                    room.users.splice(userIndex, 1);
                    // console.log(`👋 ${username} left ${roomName}`);
                    
                    // Remove socket
                    const socketIndex = room.sockets.indexOf(ws);
                    if (socketIndex !== -1) room.sockets.splice(socketIndex, 1);
                    
                    // Notify room
                    broadcastToRoom(roomName, {
                        type: 'user-left',
                        sender: username,
                        room: roomName,
                        id: uuidv4()
                    });
                    
                    // Send updated user list
                    broadcastToRoom(roomName, {
                        type: 'room-users',
                        users: room.users,
                        room: roomName,
                        id: uuidv4()
                    });
                    
                    // Clean up empty rooms
                    if (room.sockets.length === 0) {
                        broadcastRoomList() //new
                        console.log(`🧹 Cleaning empty room: ${roomName}`);
                        delete rooms[roomName];
                    }
                }
            });
        }
        
        socketToUsername.delete(ws);
        socketToRooms.delete(ws);
    });
});