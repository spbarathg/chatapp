import React from 'react';
import { useChat } from '../hooks/useChat';
import { UserList } from './UserList';
import { ChatWindow } from './ChatWindow';
import { TopBar } from './TopBar';
import { MessageInput } from './MessageInput';

export const Layout: React.FC = () => {
  const { currentChat, setCurrentChat, unreadCounts } = useChat();

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <TopBar />
      
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 flex-shrink-0 border-r border-gray-800 bg-gray-900 shadow-lg">
          <UserList
            currentChat={currentChat}
            setCurrentChat={setCurrentChat}
            unreadCounts={unreadCounts}
          />
        </aside>

        <main className="flex-1 flex flex-col bg-gray-950">
          {currentChat ? (
            <>
              <ChatWindow chatId={currentChat} />
              <MessageInput chatId={currentChat} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Select a chat to start messaging</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}; 