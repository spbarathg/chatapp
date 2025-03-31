import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { encryptMessage } from '../utils/encryption';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  encrypted: boolean;
}

const ChatWindow: React.FC = () => {
  const { contactId } = useParams<{ contactId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [contact, setContact] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadContact = async () => {
      const contacts = await window.electron.ipcRenderer.invoke('get-data', 'contacts');
      const currentContact = contacts?.find((c: any) => c.id === contactId);
      setContact(currentContact);
    };
    loadContact();
  }, [contactId]);

  useEffect(() => {
    const loadMessages = async () => {
      const storedMessages = await window.electron.ipcRenderer.invoke('get-data', `messages-${contactId}`);
      if (storedMessages) {
        setMessages(storedMessages);
      }
    };
    loadMessages();
  }, [contactId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !contact) return;

    try {
      const encryptedContent = await encryptMessage(newMessage, contact.publicKey);
      const message: Message = {
        id: Date.now().toString(),
        senderId: 'user',
        content: encryptedContent,
        timestamp: new Date().toISOString(),
        encrypted: true
      };

      const updatedMessages = [...messages, message];
      await window.electron.ipcRenderer.invoke('set-data', `messages-${contactId}`, updatedMessages);
      setMessages(updatedMessages);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-bg-primary animate-fade-in">
      {/* Chat Header */}
      <div className="flex items-center px-6 py-4 bg-dark-bg-secondary border-b border-dark-border">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-avatar bg-dark-accent-primary flex items-center justify-center text-white text-lg font-medium shadow-hover">
              {contact?.username?.charAt(0).toUpperCase()}
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-dark-bg-secondary ${
              contact?.status === 'online' ? 'bg-dark-online' : 'bg-dark-text-muted'
            }`} />
          </div>
          <div>
            <h2 className="text-chat-title font-bold text-dark-text-primary">{contact?.username}</h2>
            <span className="text-message-preview text-dark-text-muted">
              {contact?.status === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-dark-bg-tertiary scrollbar-track-dark-bg-secondary">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div
              className={`max-w-[70%] rounded-message px-4 py-3 shadow-message transition-smooth ${
                message.senderId === 'user'
                  ? 'bg-dark-message-sent text-dark-text-primary'
                  : 'bg-dark-message-received text-dark-text-primary'
              }`}
            >
              <p className="break-words text-input leading-relaxed">
                {message.encrypted ? '🔒 Encrypted' : message.content}
              </p>
              <span className="text-timestamp text-dark-text-muted mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-6 bg-dark-bg-secondary border-t border-dark-border">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-dark-input-bg border border-dark-input-border rounded-input px-4 py-3 text-input text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-dark-input-focus transition-smooth shadow-input"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-12 h-12 rounded-full bg-dark-accent-primary text-white flex items-center justify-center hover:bg-dark-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-smooth shadow-hover"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow; 