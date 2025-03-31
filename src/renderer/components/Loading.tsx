import React from 'react';

const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-discord-bg-primary">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-discord-interactive-muted rounded-full animate-ping opacity-75"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-discord-interactive-primary border-discord-interactive-muted rounded-full animate-spin"></div>
        </div>
        <p className="text-discord-text-muted text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default Loading; 