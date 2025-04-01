import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'enter-name' | 'enter-key'>('enter-name');
  const [username, setUsername] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsValidating(true);

    try {
      const isValid = await window.electron.ipcRenderer.invoke('validate-user', { username });
      if (isValid) {
        setStep('enter-key');
      } else {
        setError('Invalid username. Please use one of: Alice, Bob, Charlie, David');
        setTimeout(() => {
          window.electron.ipcRenderer.invoke('close-app');
        }, 3000);
      }
    } catch (error) {
      setError('Error validating user. Please try again.');
      setIsValidating(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsValidating(true);

    try {
      const isValid = await window.electron.ipcRenderer.invoke('validate-secret-key', {
        username,
        key: secretKey
      });

      if (isValid) {
        await window.electron.ipcRenderer.invoke('store-encryption-key', {
          key: secretKey,
          username
        });
        navigate('/chat/group');
      } else {
        setError('Invalid secret key. Application will close.');
        setTimeout(() => {
          window.electron.ipcRenderer.invoke('close-app');
        }, 2000);
      }
    } catch (error) {
      setError('Error validating secret key. Application will close.');
      setTimeout(() => {
        window.electron.ipcRenderer.invoke('close-app');
      }, 2000);
    } finally {
      setIsValidating(false);
    }
  };

  if (step === 'enter-name') {
    return (
      <div className="w-screen h-screen bg-dark-bg-primary flex flex-col items-center justify-center animate-fade-in">
        <div className="w-full max-w-md mx-auto px-8">
          <div className="bg-dark-bg-secondary rounded-lg p-8 shadow-lg animate-slide-up">
            <div className="text-center mb-8">
              <h1 className="font-inter text-4xl font-bold text-dark-text-primary mb-3">
                Who are you?
              </h1>
              <p className="font-inter text-xl text-dark-text-muted">
                Please enter your name to continue
              </p>
            </div>

            <form onSubmit={handleNameSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-dark-input-bg text-dark-text-primary px-4 py-3 rounded-input border-2 border-dark-input-border
                           focus:outline-none focus:border-dark-input-focus transition-all duration-300
                           placeholder-dark-text-muted shadow-input"
                  placeholder="Enter your name"
                  required
                  autoFocus
                  disabled={isValidating}
                />
              </div>

              {error && (
                <div className="bg-dark-error-bg rounded-lg p-3">
                  <p className="text-dark-error text-center font-inter">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isValidating}
                className="w-full bg-dark-accent-primary text-white px-6 py-3 rounded-button font-inter
                         hover:bg-dark-accent-hover transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-dark-accent-primary shadow-hover
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? 'Validating...' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-dark-bg-primary flex flex-col items-center justify-center animate-fade-in">
      <div className="w-full max-w-md mx-auto px-8">
        <div className="bg-dark-bg-secondary rounded-lg p-8 shadow-lg animate-slide-up">
          <div className="text-center mb-8">
            <h1 className="font-inter text-4xl font-bold text-dark-text-primary mb-3">
              Enter Secret Key
            </h1>
            <p className="font-inter text-xl text-dark-text-muted">
              for {username}
            </p>
          </div>

          <form onSubmit={handleKeySubmit} className="space-y-6">
            <div>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full bg-dark-input-bg text-dark-text-primary px-4 py-3 rounded-input border-2 border-dark-input-border
                         focus:outline-none focus:border-dark-input-focus transition-all duration-300
                         placeholder-dark-text-muted shadow-input"
                placeholder="Enter your secret key"
                required
                autoFocus
                disabled={isValidating}
              />
            </div>

            {error && (
              <div className="bg-dark-error-bg rounded-lg p-3">
                <p className="text-dark-error text-center font-inter">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isValidating}
              className="w-full bg-dark-accent-primary text-white px-6 py-3 rounded-button font-inter
                       hover:bg-dark-accent-hover transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-dark-accent-primary shadow-hover
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? 'Validating...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 