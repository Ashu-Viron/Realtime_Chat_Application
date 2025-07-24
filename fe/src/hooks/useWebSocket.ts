import { useState, useEffect, useRef, useCallback } from 'react';
import { Message, WebSocketMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const useWebSocket = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomUsers, setRoomUsers] = useState<string[]>([]);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      
      // Create message processor with access to current state
      const processMessage = (jsonString: string) => {
        try {
          const data: WebSocketMessage = JSON.parse(jsonString);
          
          // Check for duplicates using ref
          if (data.id && seenMessageIdsRef.current.has(data.id)) {
            return;
          }

          // Add to seen IDs
          if (data.id) {
            seenMessageIdsRef.current.add(data.id);
          }

          if (data.type === 'chat' && data.message && data.sender && data.room) {
            const message: Message = {
              id: data.id || uuidv4(),
              type: 'chat',
              room: data.room,
              message: data.message,
              sender: data.sender,
              timestamp: Date.now(),
            };
            setMessages(prev => [...prev, message]);
          } else if (data.type === 'room-users' && data.users) {
            setRoomUsers(data.users);
          } else if (data.type === 'user-joined' && data.sender && data.room) {
            const systemMessage: Message = {
              id: data.id || Date.now().toString(),
              type: 'system',
              room: data.room,
              message: `${data.sender} joined the room`,
              sender: 'System',
              timestamp: Date.now(),
            };
            setMessages(prev => [...prev, systemMessage]);
          } else if (data.type === 'user-left' && data.sender && data.room) {
            const systemMessage: Message = {
              id: data.id || Date.now().toString(),
              type: 'system',
              room: data.room,
              message: `${data.sender} left the room`,
              sender: 'System',
              timestamp: Date.now(),
            };
            setMessages(prev => [...prev, systemMessage]);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onopen = () => {
        console.log('Connected to WebSocket');
        setIsConnected(true);
        setSocket(ws);
        reconnectAttempts.current = 0;
      };

      ws.onclose = () => {
        console.log('Disconnected from WebSocket');
        setIsConnected(false);
        setSocket(null);
        
        // Auto-reconnect logic
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            console.log(`Reconnect attempt ${reconnectAttempts.current}`);
            connect();
          }, Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000));
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onmessage = (event) => {
        // Handle Blob messages synchronously
        if (event.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            processMessage(reader.result as string);
          };
          reader.readAsText(event.data);
        } else {
          processMessage(event.data);
        }
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }, [url]);

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && isConnected) {
      if (!message.id) {
        message.id = uuidv4();
      }
      
      // Add optimistic UI update for sent messages
      if (message.type === 'chat') {
        setMessages(prev => [...prev, {
          id: message.id!,
          type: 'chat',
          room: message.room!,
          message: message.message!,
          sender: message.sender!,
          timestamp: Date.now(),
        }]);
      }
      
      socket.send(JSON.stringify(message));
    }
  }, [socket, isConnected]);

  return {
    isConnected,
    messages,
    roomUsers,
    sendMessage,
  };
};