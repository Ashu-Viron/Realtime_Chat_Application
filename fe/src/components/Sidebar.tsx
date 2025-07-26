import React, { useState } from 'react';
import { Hash, Plus, Users, Settings, Wifi, WifiOff } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  rooms: string[];
  currentRoom: string;
  username: string;
  isConnected: boolean;
   joinedRooms: string[];  // rooms this user has joined
  roomUsers: string[];
  isDark: boolean;
  onRoomChange: (room: string) => void;
  onCreateRoom: (room: string) => void;
  onToggleTheme: () => void;
   onJoinRoom: (room: string) => void;
   joinableRooms: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  rooms,
  currentRoom,
  username,
  isConnected,
  // joinedRooms, // new
  roomUsers,
  isDark,
  onRoomChange,
  onCreateRoom,
  onToggleTheme,
  onJoinRoom ,//new
  joinableRooms,
}) => {
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  //new
// const joinedSet = new Set(joinedRooms);
// const joinableRooms = rooms.filter(r => !joinedSet.has(r));
//new

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newRoomName.trim().toLowerCase().replace(/\s+/g, '-');
    //new
     if (!trimmedName) return;
      if (rooms.includes(trimmedName)) {
    alert(`Room "${trimmedName}" already exists.`);
  } else {
    onCreateRoom(trimmedName);
    setNewRoomName('');
    setShowCreateRoom(false);
  }

    // if (trimmedName && !rooms.includes(trimmedName)) {
    //   onCreateRoom(trimmedName);
    //   setNewRoomName('');
    //   setShowCreateRoom(false);
    // }
  };
  

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Chat App
          </h1>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              isConnected 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {isConnected ? (
                <><Wifi className="w-3 h-3" /> Connected</>
              ) : (
                <><WifiOff className="w-3 h-3" /> Disconnected</>
              )}
            </div>
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>{username}</span>
        </div>
      </div>

      {/* Rooms */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Rooms
            </h2>
            <button
              onClick={() => setShowCreateRoom(!showCreateRoom)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Create room"
            >
              <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {showCreateRoom && (
            <form onSubmit={handleCreateRoom} className="mb-3">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room name"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                autoFocus
              />
            </form>
          )}

          <div className="space-y-1">
            {rooms.map((room) => (
              <button
                key={room}
                onClick={() => onRoomChange(room)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  currentRoom === room
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Hash className="w-4 h-4" />
                <span className="font-medium">{room}</span>
              </button>
            ))}
          </div>

           {/* ✅ Joinable rooms should be INSIDE here */}
  {joinableRooms.length > 0 && (
    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
        Joinable Rooms
      </h2>
      <div className="space-y-1">
        {joinableRooms.map((room) => (
          <button
            key={room}
            onClick={() => {onJoinRoom(room);onRoomChange(room)}}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Hash className="w-4 h-4" />
            <span className="font-medium">{room}</span>
          </button>
        ))}
      </div>
    </div>
  )}
        </div>

        {/* Current Room Users */}
      {currentRoom && roomUsers.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Online ({roomUsers.length})
            </h3>
          </div>
          <div className="space-y-2">
            {roomUsers.map((user) => (
              <div
                key={user}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{user}</span>
                {/* Show "You" indicator for current user */}
                {user === username && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    (you)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};