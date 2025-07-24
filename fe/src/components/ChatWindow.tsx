import React, { useEffect, useRef } from 'react';
import { Hash } from 'lucide-react';
import { Message } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatWindowProps {
  messages: Message[];
  currentRoom: string;
  username: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  currentRoom, 
  username 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const roomMessages = messages.filter(msg => msg.room === currentRoom);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages]);

  const shouldShowSender = (message: Message, index: number) => {
    if (message.type === 'system') return false;
    if (index === 0) return true;
    const previousMessage = roomMessages[index - 1];
    return previousMessage.sender !== message.sender || 
           message.timestamp - previousMessage.timestamp > 300000; // 5 minutes
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <Hash className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentRoom}
          </h2>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-1"
      >
        {roomMessages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Welcome to #{currentRoom}</p>
              <p className="text-sm">This is the start of your conversation in this room.</p>
            </div>
          </div>
        ) : (
          <>
            {roomMessages.map((message, index) => (
              <MessageBubble
                key={`${message.id}-${index}`}
                message={message}
                isOwn={message.sender === username}
                showSender={shouldShowSender(message, index)}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
};