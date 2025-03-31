import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const USERS = [
  { id: '1', name: 'Tanish', avatar: 'T' },
  { id: '2', name: 'Barath', avatar: 'B' },
  { id: '3', name: 'Joseph', avatar: 'J' },
  { id: '4', name: 'Yashas', avatar: 'Y' },
];

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select-user' | 'enter-key'>('select-user');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    setStep('enter-key');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const encryptionKey = {
        key: secretKey,
        userId: selectedUser,
        userName: USERS.find(u => u.id === selectedUser)?.name
      };
      
      await window.electron.ipcRenderer.invoke('store-encryption-key', { key: encryptionKey });
      navigate('/chat/default');
    } catch (error) {
      console.error('Login failed:', error);
      setError('Invalid secret key. Please try again.');
    }
  };

  const handleBack = () => {
    setStep('select-user');
    setSelectedUser(null);
    setSecretKey('');
    setError('');
  };

  if (step === 'select-user') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-discord-bg-primary p-section-gap">
        <div className="w-full max-w-lg animate-fade-in">
          <div className="text-center mb-section-gap">
            <h1 className="text-title mb-3">
              Welcome to Secure Chat
            </h1>
            <p className="text-subtitle">
              Choose your profile to continue
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-chat-padding">
            {USERS.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user.id)}
                className="chat-item group"
              >
                <div className="chat-avatar">
                  <div className="avatar-circle">
                    {user.avatar}
                  </div>
                  <div className="status-indicator status-online"></div>
                </div>
                <span className="ml-6 text-subtitle group-hover:text-discord-text-primary transition-all duration-smooth ease-smooth">
                  {user.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-discord-bg-primary p-section-gap">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-discord-bg-secondary p-8 rounded-message shadow-message">
          <div className="text-center mb-8">
            <h1 className="text-title mb-3">
              Enter Secret Key
            </h1>
            <p className="text-subtitle">
              for {USERS.find(u => u.id === selectedUser)?.name}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="input-primary"
                placeholder="Enter your secret key"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-discord-error-bg rounded-message p-3">
                <p className="text-discord-error text-message-preview text-center">
                  {error}
                </p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleBack}
                className="btn-secondary"
              >
                Back
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 