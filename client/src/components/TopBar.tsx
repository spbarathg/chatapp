import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';

export const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentChat } = useChat();

  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800 shadow-md">
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-semibold text-white">
          Secure Chat
        </h1>
        <span className="text-sm text-emerald-400 font-medium">
          • All Encrypted
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-200 font-medium">
            {user?.username}
          </span>
          <button
            onClick={logout}
            className="px-3 py-1 rounded-md text-sm bg-red-500 hover:bg-red-600 text-white transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}; 