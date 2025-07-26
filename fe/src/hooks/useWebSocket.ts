import { useState, useEffect, useRef, useCallback } from 'react';
import { Message, WebSocketMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const useWebSocket = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomUsers, setRoomUsers] = useState<string[]>([]);
  const [joinableRooms, setJoinableRooms] = useState<string[]>([]);


  //new
  const [rooms, setRooms] = useState<string[]>(['general']); // global room list
  //new
  const currentRoomRef = useRef(currentRoom);
  const seenMessageIdsRef = useRef(new Set<string>());
  const roomUserMap = useRef<Record<string, string[]>>({});

  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  useEffect(() => {
    const ws = new WebSocket(url);
    setSocket(ws);

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(
        JSON.stringify({
          type: 'get-room-list',
        })
      );
      console.log('✅ WebSocket connected');
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('❌ WebSocket disconnected');
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        // console.log('📥 Received:', data);

        // Avoid duplicates
        if (data.id && seenMessageIdsRef.current.has(data.id)) return;
        if (data.id) seenMessageIdsRef.current.add(data.id);

        switch (data.type) {
          case 'chat':
             if (
    data.type === 'chat' &&
    typeof data.message === 'string' &&
    typeof data.sender === 'string' &&
    typeof data.room === 'string' &&
    data.room === currentRoomRef.current
  ) {
    const newMessage: Message = {
      id: data.id || uuidv4(),
      type: 'chat',
      room: data.room, // string ✅
      message: data.message, // string ✅
      sender: data.sender, // string ✅
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMessage]);
  }
            break;

          case 'room-users':
            if (data.users && data.room) {
              roomUserMap.current[data.room] = data.users;
              if (data.room === currentRoomRef.current) {
                setRoomUsers(data.users);
              }
            }
            break;
          case 'room-list':
            if (Array.isArray(data.rooms)) {
              setJoinableRooms(data.rooms);
            }
          break;
          case 'room-created':
  if (data.room) {
    // You can optionally update rooms or trigger join logic here.
    // Usually, 'room-created' is just a notification;
    // your server already broadcasts 'room-list' which updates rooms.

    // console.log(`🔔 Room created notification received: ${data.room}`);
    // If you want, you can refresh rooms by requesting or trust 'room-list' to come soon.
  }
  break;
          case 'user-joined':
          case 'user-left':
            // Optional: Handle user join/leave events
            break;

          default:
            // console.warn('⚠️ Unrecognized message type:', data.type);
        }
      } catch (err) {
        // console.error('❌ Error processing message:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [url]);

  
  const sendMessage = useCallback(
    (msg: Omit<WebSocketMessage, 'id'>) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;

      const fullMessage: WebSocketMessage = {
        ...msg,
        id: uuidv4(),
      };

      // console.log('📤 Sending message:', fullMessage);
      socket.send(JSON.stringify(fullMessage));
    },
    [socket]
  );

  const joinRoom = useCallback(
    (room: string, username: string) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;

      const joinMessage: WebSocketMessage = {
        type: 'join-room',
        room,
        sender: username,
      };

      // console.log('📤 Joining room:', joinMessage);
      socket.send(JSON.stringify(joinMessage));
    },
    [socket]
  );

  const updateCurrentRoom = useCallback((room: string) => {
    const normalized = room.toLowerCase();
    currentRoomRef.current = normalized;
    setCurrentRoom(normalized);
    const cached = roomUserMap.current[normalized] || [];
    setRoomUsers(cached);
  }, []);

  //new
  const createRoom = useCallback((roomName: string, username: string) => {
  const normalized = roomName.toLowerCase();
  // if (!rooms.includes(normalized)) {
    updateCurrentRoom(normalized);
    joinRoom(normalized, username);
  // }
}, [ joinRoom, updateCurrentRoom]);
//new
  return {
    socket,
    isConnected,
    messages,
    roomUsers,
    currentRoom,
    sendMessage,
    joinRoom,
    updateCurrentRoom,
    createRoom,
    joinableRooms  // ✅ ADD THIS
  };
};
