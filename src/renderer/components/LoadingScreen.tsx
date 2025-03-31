import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-discord-bg-primary">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-discord-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-discord-text-primary text-lg">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingScreen; 