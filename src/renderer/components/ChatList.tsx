import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
}

const ChatList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [chats, setChats] = useState<Chat[]>([
    { id: 'default', name: 'General', lastMessage: 'Welcome to the chat!', timestamp: new Date().toISOString() },
    { id: 'team', name: 'Team Chat', lastMessage: 'Let\'s discuss the project', timestamp: new Date().toISOString() },
    { id: 'random', name: 'Random', lastMessage: 'Hello everyone!', timestamp: new Date().toISOString() },
  ]);

  const currentChatId = location.pathname.split('/').pop() || 'default';

  return (
    <div className="h-full flex flex-col bg-dark-bg-secondary animate-fade-in">
      <div className="p-6 border-b border-dark-border">
        <h2 className="text-chat-title font-bold text-dark-text-primary">Chats</h2>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => navigate(`/chat/${chat.id}`)}
            className={`w-full px-6 py-4 flex items-start space-x-4 hover:bg-dark-bg-hover transition-smooth animate-slide-up ${
              currentChatId === chat.id ? 'bg-dark-bg-active' : ''
            }`}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-avatar bg-dark-accent-primary flex items-center justify-center text-white font-medium text-lg shadow-hover">
                {chat.name[0]}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-dark-online border-2 border-dark-bg-secondary"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-dark-text-primary font-semibold truncate">{chat.name}</h3>
                <span className="text-timestamp text-dark-text-muted ml-2">
                  {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-message-preview text-dark-text-muted truncate">{chat.lastMessage}</p>
            </div>
          </button>
        ))}
      </div>
      {/* Settings Button */}
      <button
        onClick={() => navigate('/settings')}
        className="p-4 border-t border-dark-border hover:bg-dark-bg-hover transition-smooth flex items-center space-x-4 text-dark-text-primary"
      >
        <div className="w-12 h-12 rounded-avatar bg-dark-accent-muted flex items-center justify-center shadow-hover">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span className="font-medium">Settings</span>
      </button>
    </div>
  );
};

export default ChatList; 