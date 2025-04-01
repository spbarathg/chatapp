import React from 'react';

const Loading: React.FC = () => {
  return (
    <div className="w-screen h-screen bg-dark-bg-primary flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-dark-accent-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-dark-text-muted font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default Loading; 