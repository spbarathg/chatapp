import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Settings {
  theme: 'light' | 'dark';
  notifications: boolean;
  encryption: boolean;
}

interface UserInfo {
  userId: string;
  userName: string;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>({
    theme: 'dark',
    notifications: true,
    encryption: true,
  });
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const storedSettings = await window.electron.ipcRenderer.invoke('get-data', 'settings');
      if (storedSettings) {
        setSettings(storedSettings);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const encryptionKey = await window.electron.ipcRenderer.invoke('get-encryption-key');
        if (encryptionKey) {
          setUserInfo({
            userId: encryptionKey.userId,
            userName: encryptionKey.userName
          });
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };

    fetchUserInfo();
  }, []);

  const handleSettingChange = (setting: keyof Settings) => async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newSettings = {
      ...settings,
      [setting]: event.target.checked,
    };
    setSettings(newSettings);
    await window.electron.ipcRenderer.invoke('set-data', 'settings', newSettings);
  };

  const handleLogout = async () => {
    try {
      await window.electron.ipcRenderer.invoke('clear-encryption-key');
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <div className="flex-1 bg-discord-bg-primary p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-chat-title font-bold text-discord-text-primary">Settings</h1>
          <button
            onClick={() => navigate('/chat/default')}
            className="text-discord-text-muted hover:text-discord-text-primary transition-smooth p-2 rounded-full hover:bg-discord-hover"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* User Profile Section */}
        <div className="bg-discord-bg-secondary rounded-message p-6 mb-6 shadow-message">
          <h2 className="text-chat-title font-bold text-discord-text-primary mb-6">User Profile</h2>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-discord-interactive-primary flex items-center justify-center text-white text-2xl font-medium">
                {userInfo?.userName?.[0] || '?'}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-discord-bg-secondary"></div>
            </div>
            <div>
              <h3 className="text-input font-semibold text-discord-text-primary mb-1">
                {userInfo?.userName || 'Loading...'}
              </h3>
              <p className="text-message-preview text-discord-text-muted">
                User ID: {userInfo?.userId || 'Loading...'}
              </p>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-discord-bg-secondary rounded-message p-6 shadow-message">
          <h2 className="text-chat-title font-bold text-discord-text-primary mb-6">Account Actions</h2>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white px-6 py-3 rounded-input font-medium hover:bg-red-600 transition-smooth flex items-center justify-center space-x-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zm-3 1a1 1 0 10-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 