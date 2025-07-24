export interface Message {
  id: string;
  type: 'chat' | 'system';
  room: string;
  message: string;
  sender: string;
  timestamp: number;
}

export interface Room {
  id: string;
  name: string;
  lastMessage?: string;
  unreadCount: number;
  users: string[];
}

export interface User {
  id: string;
  name: string;
  isOnline: boolean;
}

export interface WebSocketMessage {
  id?: string;
  type: 'join-room' | 'chat' | 'user-joined' | 'user-left' | 'room-users';
  room?: string;
  message?: string;
  sender?: string;
  users?: string[];
}