import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Contact {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  isGroup?: boolean;
}

const ChatList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<string>('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserAndContacts = async () => {
      try {
        const userData = await window.electron.ipcRenderer.invoke('get-current-user');
        setCurrentUser(userData.username);

        // Get all valid users
        const allUsers = ['tanish', 'joseph', 'barath', 'yashas'];
        
        // Filter out current user and create contact list
        const userContacts = allUsers
          .filter(user => user !== userData.username)
          .map(user => ({
            id: user,
            name: user.charAt(0).toUpperCase() + user.slice(1),
            lastMessage: 'No messages yet',
            timestamp: new Date().toISOString(),
          }));

        // Add group chat
        const groupChat: Contact = {
          id: 'group',
          name: 'Group Chat',
          lastMessage: 'Welcome to the group chat!',
          timestamp: new Date().toISOString(),
          isGroup: true
        };

        setContacts([groupChat, ...userContacts]);
      } catch (error) {
        console.error('Error loading contacts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserAndContacts();
  }, []);

  const currentChatId = location.pathname.split('/').pop() || 'group';

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-dark-bg-secondary animate-fade-in">
      <div className="p-6 border-b border-dark-border">
        <h2 className="text-chat-title font-bold text-dark-text-primary">Chats</h2>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {contacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => navigate(`/chat/${contact.id}`)}
            className={`w-full px-6 py-4 flex items-start space-x-4 hover:bg-dark-bg-hover transition-smooth animate-slide-up ${
              currentChatId === contact.id ? 'bg-dark-bg-active' : ''
            }`}
          >
            <div className="relative">
              <div className={`w-12 h-12 rounded-avatar flex items-center justify-center text-white font-medium text-lg shadow-hover ${
                contact.isGroup ? 'bg-dark-accent-secondary' : 'bg-dark-accent-primary'
              }`}>
                {contact.isGroup ? '👥' : contact.name[0]}
              </div>
              {!contact.isGroup && (
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-dark-online border-2 border-dark-bg-secondary"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-dark-text-primary font-semibold truncate">{contact.name}</h3>
                <span className="text-timestamp text-dark-text-muted ml-2">
                  {new Date(contact.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-message-preview text-dark-text-muted truncate">{contact.lastMessage}</p>
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