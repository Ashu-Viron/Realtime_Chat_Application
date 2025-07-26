import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import { UsernameModal } from './components/UsernameModal';
import { useWebSocket } from './hooks/useWebSocket';
import { useTheme } from './hooks/useTheme';
import { storage } from './utils/storage';
import { v4 as uuidv4 } from 'uuid';

const WEBSOCKET_URL = 'ws://localhost:8080';

function App() {
  const [username, setUsername] = useState<string>('');
  const [currentRoom, setCurrentRoom] = useState<string>('general');
  const [rooms, setRooms] = useState<string[]>([]);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  
  
  const { isDark, toggleTheme } = useTheme();
  const { isConnected, messages, roomUsers, sendMessage, updateCurrentRoom,joinRoom ,joinableRooms,createRoom } = useWebSocket(WEBSOCKET_URL);

  // Update current room in WebSocket hook
  useEffect(() => {
    updateCurrentRoom(currentRoom);
  }, [currentRoom, updateCurrentRoom]);

  // Initialize app state from localStorage
  useEffect(() => {
    const savedUsername = storage.getUsername();
    const savedRoom = storage.getCurrentRoom();
    const savedRooms = storage.getRooms();
    
    setRooms(savedRooms);
    
    if (savedUsername) {
      setUsername(savedUsername);
      if (savedRoom && savedRooms.includes(savedRoom)) {
        setCurrentRoom(savedRoom);
      }
    } else {
      setShowUsernameModal(true);
    }
  }, []);

  // Join room when user changes room or connects
  useEffect(() => {
    if (username && currentRoom && isConnected) {
      const roomName = currentRoom.toLowerCase().trim();
      // console.log(`🚪 Joining room: ${roomName}`);
      
      sendMessage({
        type: 'join-room',
        room: roomName,
        sender: username,
      
      });
    }
  }, [username, currentRoom, isConnected, sendMessage]);


  

  const handleUsernameSubmit = useCallback((newUsername: string) => {
    setUsername(newUsername);
    storage.setUsername(newUsername);
    setShowUsernameModal(false);
  }, []);

  const handleRoomChange = useCallback((room: string) => {
    const roomName = room.toLowerCase().trim();
    // console.log(`🔄 Changing to room: ${roomName}`);
    
    setCurrentRoom(roomName);
    storage.setCurrentRoom(roomName);
    updateCurrentRoom(roomName);
    
    if (isConnected) {
      sendMessage({
        type: 'join-room',
        room: roomName,
        sender: username,
      });
    }
  }, [isConnected, sendMessage, username, updateCurrentRoom]);

  // const handleCreateRoom = useCallback((roomName: string) => {
  //   storage.addRoom(roomName);
  //   setRooms(storage.getRooms());
  //   handleRoomChange(roomName);
  // }, [handleRoomChange]);

  const handleSendMessage = useCallback((message: string) => {
    if (isConnected && currentRoom) {
      sendMessage({
        type: 'chat',
        room: currentRoom.toLowerCase(),
        message,
        sender: username,
      });
    }
  }, [isConnected, currentRoom, sendMessage, username]);

  const [joinedRooms, setJoinedRooms] = useState<string[]>(['general']);
//new/////////////////
  useEffect(() => {
  // Automatically join any new rooms received from the server
  rooms.forEach(room => {
    if (!joinedRooms.includes(room)) {
      setJoinedRooms(prev => [...prev, room]);
      joinRoom(room, username);
      
    }
  });
}, [rooms]);
////////////////

// When you join a room:new
// const handleJoinRoom = (room: string) => {
//   if (!joinedRooms.includes(room)) {
//     setJoinedRooms((prev) => [...prev, room]);
//   }
//   joinRoom(room, username);
//   updateCurrentRoom(room);
// };//new
  return (
    <div className="h-screen flex bg-gray-100 dark:bg-gray-900">
      <UsernameModal 
        isOpen={showUsernameModal} 
        onSubmit={handleUsernameSubmit} 
      />
      
      <Sidebar
        rooms={rooms}
        joinedRooms={joinedRooms} // this should track only rooms this user has joined
        currentRoom={currentRoom}
        username={username}
        isConnected={isConnected}
        roomUsers={roomUsers}
        isDark={isDark}
        onRoomChange={handleRoomChange}
        onCreateRoom={(room) => {
    createRoom(room, username);
    if (!joinedRooms.includes(room)) {
      setJoinedRooms([...joinedRooms, room]);
    }
  }}
        onJoinRoom={(room) => {
        joinRoom(room, username);
        if (!joinedRooms.includes(room)) {
          setJoinedRooms([...joinedRooms, room]);
            }
          }}
        onToggleTheme={toggleTheme}
        joinableRooms={joinableRooms} 
      />
      
      <div className="flex-1 flex flex-col">
        <ChatWindow
          messages={messages}
          currentRoom={currentRoom}
          username={username}
        />
        
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!isConnected}
        />
      </div>
    </div>
  );
}

export default App;