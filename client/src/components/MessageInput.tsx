import React, { useState, useRef } from 'react';
import { useMessages } from '../hooks/useMessages';
import { useChat } from '../hooks/useChat';

interface MessageInputProps {
  chatId: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ chatId }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, sendFile } = useMessages(chatId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(message.trim());
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await sendFile(file);
    } catch (error) {
      console.error('Failed to send file:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800 bg-gray-900 shadow-lg">
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full hover:bg-gray-800 text-gray-300 hover:text-white transition-all duration-200 hover:shadow-md"
          aria-label="Attach file"
        >
          📎
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full px-4 py-2 text-sm bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-700 transition-all duration-200 shadow-sm"
          disabled={isSending}
        />

        <button
          type="button"
          className="p-2 rounded-full hover:bg-gray-800 text-gray-300 hover:text-white transition-all duration-200 hover:shadow-md"
          aria-label="Open emoji picker"
        >
          😊
        </button>

        <button
          type="submit"
          disabled={!message.trim() || isSending}
          className={`p-2 rounded-full transition-all duration-200 ${
            message.trim() && !isSending
              ? 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/20'
              : 'bg-gray-800 text-gray-500'
          }`}
          aria-label="Send message"
        >
          {isSending ? '⏳' : '➤'}
        </button>
      </div>
    </form>
  );
}; 