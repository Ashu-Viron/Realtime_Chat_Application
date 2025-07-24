import { WebSocketServer, WebSocket as WebSocketWsType } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const wss = new WebSocketServer({ port: 8080 });

interface Room {
    sockets: WebSocketWsType[];
    users: string[];
}

const RELAYER_URL = "ws://localhost:3001";
const relayerSocket = new WebSocket(RELAYER_URL);
const rooms: Record<string, Room> = {};
const socketToUsername = new Map<WebSocketWsType, string>();

// Helper function to safely get or create a room
function getOrCreateRoom(roomName: string): Room {
    if (!rooms[roomName]) {
        rooms[roomName] = { sockets: [], users: [] };
    }
    return rooms[roomName];
}

relayerSocket.onmessage = async ({ data }) => {
    let jsonString: string;

    try {
        if (data instanceof Blob) {
            jsonString = await data.text();
        } else if (typeof data === 'string') {
            jsonString = data;
        } else if (data instanceof ArrayBuffer) {
            jsonString = Buffer.from(data).toString('utf8');
        } else {
            throw new Error('Unsupported data format received in relayerSocket');
        }

        const parsedData = JSON.parse(jsonString);
        console.log("Parsed Data:", parsedData);

        if (parsedData.room) {
            const room = rooms[parsedData.room];
            if (room) {
                room.sockets.forEach(socket => {
                    if (socket.readyState === socket.OPEN) {
                        socket.send(jsonString);
                    }
                });
            }
        }
    } catch (err) {
        console.error("Error handling relayerSocket message:", err);
    }
};

// Helper function to broadcast to room
function broadcastToRoom(roomName: string, message: any) {
    const room = rooms[roomName];
    if (!room) return;

    const messageWithId = {
        ...message,
        id: uuidv4()
    };

    room.sockets.forEach(socket => {
        if (socket.readyState === socket.OPEN) {
            socket.send(JSON.stringify(messageWithId));
        }
    });
}

wss.on('connection', function connection(ws) {
    ws.on('error', console.error);

    ws.on('message', function message(data: string) {
        try {
            const parsedData = JSON.parse(data);
            
            if (parsedData.type === "join-room" && parsedData.room && parsedData.sender) {
                const roomName = parsedData.room;
                const username = parsedData.sender;
                const room = getOrCreateRoom(roomName);
                
                // Store username for this socket
                socketToUsername.set(ws, username);
                
                // Add socket to room if not already present
                if (!room.sockets.includes(ws)) {
                    room.sockets.push(ws);
                }
                
                // Add user to room if not already present
                if (!room.users.includes(username)) {
                    room.users.push(username);
                    
                    // Notify others about new user
                    broadcastToRoom(roomName, {
                        type: 'user-joined',
                        sender: username,
                        room: roomName
                    });
                    
                    // Send updated user list
                    broadcastToRoom(roomName, {
                        type: 'room-users',
                        users: room.users,
                        room: roomName
                    });
                }
            }
            
            // Always send to relayer
            if (relayerSocket.readyState === relayerSocket.OPEN) {
                relayerSocket.send(JSON.stringify(parsedData));
            }
        } catch (err) {
            console.error("Error processing message:", err);
        }
    });

    ws.on('close', () => {
        const username = socketToUsername.get(ws);
        socketToUsername.delete(ws);
        
        if (!username) return;

        Object.entries(rooms).forEach(([roomName, room]) => {
            const userIndex = room.users.indexOf(username);
            const socketIndex = room.sockets.indexOf(ws);

            if (userIndex !== -1) {
                room.users.splice(userIndex, 1);
            }

            if (socketIndex !== -1) {
                room.sockets.splice(socketIndex, 1);
            }

            if (userIndex !== -1) {
                broadcastToRoom(roomName, {
                    type: 'user-left',
                    sender: username,
                    room: roomName
                });

                broadcastToRoom(roomName, {
                    type: 'room-users',
                    users: room.users,
                    room: roomName
                });
            }
        });
    });
});