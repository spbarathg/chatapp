import React, { useEffect, useRef } from 'react';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';

interface ChatWindowProps {
  chatId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chatId }) => {
  const { messages, loadMessages, markAsRead } = useMessages(chatId);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    markAsRead();
  }, [chatId, loadMessages, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-950">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.senderId === user?.id ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[70%] rounded-lg p-3 shadow-md transition-all duration-200 ${
              message.senderId === user?.id
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            <p className="text-sm break-words leading-relaxed">{message.content}</p>
            <div className="flex items-center justify-end space-x-1 mt-1">
              <span className="text-xs text-gray-300">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {message.senderId === user?.id && (
                <span className="text-xs opacity-90">
                  {message.read ? '🟢' : message.delivered ? '🟩' : '🟦'}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}; 