import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  username: string;
  avatar: string;
  status: 'online' | 'offline';
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userData = await window.electron.ipcRenderer.invoke('get-current-user');
        setProfile({
          username: userData.username,
          avatar: userData.avatar || userData.username[0].toUpperCase(),
          status: userData.status || 'offline'
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const avatarUrl = await window.electron.ipcRenderer.invoke('upload-avatar', { file });
      await window.electron.ipcRenderer.invoke('update-profile', {
        ...profile,
        avatar: avatarUrl
      });
      setProfile(prev => prev ? { ...prev, avatar: avatarUrl } : null);
      setSuccess('Avatar updated successfully');
    } catch (error) {
      console.error('Error updating avatar:', error);
      setError('Failed to update avatar');
    }
  };

  const handleSignOut = async () => {
    try {
      await window.electron.ipcRenderer.invoke('clear-encryption-key');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-dark-bg-primary animate-fade-in">
      <div className="p-6 border-b border-dark-border">
        <h2 className="text-chat-title font-bold text-dark-text-primary">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 bg-dark-error-bg rounded-lg p-3">
            <p className="text-dark-error text-center font-inter">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-dark-success-bg rounded-lg p-3">
            <p className="text-dark-success text-center font-inter">{success}</p>
          </div>
        )}

        <div className="max-w-2xl mx-auto space-y-8">
          {/* Profile Section */}
          <div className="bg-dark-bg-secondary rounded-lg p-6">
            <h3 className="text-xl font-bold text-dark-text-primary mb-6">Profile</h3>
            
            <div className="flex items-center space-x-6 mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-avatar bg-dark-accent-primary flex items-center justify-center text-white text-3xl font-medium shadow-hover">
                  {profile?.avatar}
                </div>
                <label className="absolute bottom-0 right-0 bg-dark-accent-primary text-white rounded-full p-2 cursor-pointer hover:bg-dark-accent-hover transition-smooth">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-dark-text-primary">{profile?.username}</h4>
                <span className={`inline-flex items-center text-dark-text-muted ${
                  profile?.status === 'online' ? 'text-dark-online' : ''
                }`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    profile?.status === 'online' ? 'bg-dark-online' : 'bg-dark-text-muted'
                  }`} />
                  {profile?.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-dark-bg-secondary rounded-lg p-6">
            <h3 className="text-xl font-bold text-dark-text-primary mb-6">Security</h3>
            <p className="text-dark-text-muted mb-4">
              Your messages are end-to-end encrypted. Only you and the recipient can read them.
            </p>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full bg-dark-error text-white px-6 py-3 rounded-button font-inter
                     hover:bg-dark-error-hover transition-all duration-300
                     focus:outline-none focus:ring-2 focus:ring-dark-error shadow-hover"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 