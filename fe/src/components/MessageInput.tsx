import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
// import { Picker } from 'emoji-mart';
// import 'emoji-mart/css/emoji-mart.css'; 
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  disabled = false 
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
   const emojiPickerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
      resetTextareaHeight();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // Max 5 lines approximately
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

   // Close emoji picker if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const addEmoji = (emoji: any) => {
  const cursorPosition = textareaRef.current?.selectionStart || 0;
  const newText =
    message.slice(0, cursorPosition) + emoji.native + message.slice(cursorPosition);

  setMessage(newText);

  setTimeout(() => {
    // Reset emoji picker
    setShowEmojiPicker(false);

    // Restore focus & cursor position
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionEnd = cursorPosition + emoji.native.length;
      adjustTextareaHeight(); // Fix height after emoji add
    }
  }, 0);
};


  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none max-h-32 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
          />
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="absolute right-3 bottom-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-full right-0 mb-2 z-10"
            >
              <Picker
                data={data}
                onEmojiSelect={addEmoji}
                style={{ width: '300px' }}
                emojiSize={24}
                showSkinTones={false}
                showPreview={false}
              />
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white p-3 rounded-2xl transition-colors disabled:cursor-not-allowed flex items-center justify-center"
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};