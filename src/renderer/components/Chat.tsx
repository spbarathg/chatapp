import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="flex h-screen w-screen bg-discord-bg-primary overflow-hidden">
      <div className="w-72 border-r border-discord-border">
        <ChatList />
      </div>
      <div className="flex-1">
        <Routes>
          <Route path=":id" element={<ChatWindow />} />
          <Route path="*" element={<Navigate to="default" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default Chat; 