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
      <div className="w-screen h-screen bg-[#12121b] flex flex-col items-center justify-center">
        <div className="w-full max-w-screen-xl mx-auto px-8">
          <div className="text-center mb-16">
            <h1 className="font-montserrat text-4xl font-bold text-white mb-3">
              Welcome to Secure Chat
            </h1>
            <h2 className="font-montserrat text-xl text-[#a0aec0]">
              Choose your profile to continue
            </h2>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-2 gap-6">
              {USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user.id)}
                  className="bg-[#2d2e40] rounded-lg p-6 flex items-center gap-4
                           hover:bg-[#363749] transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-[#5865F2] flex items-center justify-center
                                  text-2xl font-semibold text-white">
                      {user.avatar}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#5ADB6B] 
                                  border-2 border-[#2d2e40]">
                    </div>
                  </div>
                  <span className="text-lg text-white font-montserrat font-medium">
                    {user.name}
                  </span>
                </button>
              ))}
            </div>
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