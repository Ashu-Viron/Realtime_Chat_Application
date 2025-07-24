import  { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import { UsernameModal } from './components/UsernameModal';
import { useWebSocket } from './hooks/useWebSocket';
import { useTheme } from './hooks/useTheme';
import { storage } from './utils/storage';

const WEBSOCKET_URL = 'ws://localhost:8080';

function App() {
  const [username, setUsername] = useState<string>('');
  const [currentRoom, setCurrentRoom] = useState<string>('general');
  const [rooms, setRooms] = useState<string[]>([]);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  
  const { isDark, toggleTheme } = useTheme();
  const { isConnected, messages, roomUsers, sendMessage } = useWebSocket(WEBSOCKET_URL);

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
      sendMessage({
        type: 'join-room',
        room: currentRoom,
      });
    }
  }, [username, currentRoom, isConnected, sendMessage]);

  const handleUsernameSubmit = (newUsername: string) => {
    setUsername(newUsername);
    storage.setUsername(newUsername);
    setShowUsernameModal(false);
  };

  const handleRoomChange = (room: string) => {
    setCurrentRoom(room);
    storage.setCurrentRoom(room);
    
    if (isConnected) {
      sendMessage({
        type: 'join-room',
        room,
      });
    }
  };

  const handleCreateRoom = (roomName: string) => {
    storage.addRoom(roomName);
    setRooms(storage.getRooms());
    handleRoomChange(roomName);
  };

  const handleSendMessage = (message: string) => {
    if (isConnected && currentRoom) {
      sendMessage({
        type: 'chat',
        room: currentRoom,
        message,
        sender: username,
      });
    }
  };

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-gray-900">
      <UsernameModal 
        isOpen={showUsernameModal} 
        onSubmit={handleUsernameSubmit} 
      />
      
      <Sidebar
        rooms={rooms}
        currentRoom={currentRoom}
        username={username}
        isConnected={isConnected}
        roomUsers={roomUsers}
        isDark={isDark}
        onRoomChange={handleRoomChange}
        onCreateRoom={handleCreateRoom}
        onToggleTheme={toggleTheme}
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