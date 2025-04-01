import React from 'react';
import { useUsers } from '../hooks/useUsers';
import { useChat } from '../hooks/useChat';

interface UserListProps {
  currentChat: string | null;
  setCurrentChat: (userId: string) => void;
  unreadCounts: Record<string, number>;
}

export const UserList: React.FC<UserListProps> = ({
  currentChat,
  setCurrentChat,
  unreadCounts
}) => {
  const { users, onlineUsers } = useUsers();

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">
          Contacts
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => setCurrentChat(user.id)}
            className={`w-full p-4 flex items-center space-x-3 transition-all duration-200 ${
              currentChat === user.id
                ? 'bg-gray-800 shadow-md'
                : 'hover:bg-gray-800/50'
            }`}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center shadow-sm">
                <span className="text-lg text-white font-medium">
                  {user.username[0].toUpperCase()}
                </span>
              </div>
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 transition-colors duration-200 ${
                onlineUsers.includes(user.id)
                  ? 'bg-emerald-500'
                  : 'bg-gray-600'
              }`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white truncate">
                  {user.username}
                </span>
                {unreadCounts[user.id] > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white shadow-sm">
                    {unreadCounts[user.id]}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400 truncate">
                {onlineUsers.includes(user.id) ? 'Online' : 'Offline'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}; 