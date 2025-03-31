import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Chat from './components/Chat';
import Settings from './components/Settings';
import Loading from './components/Loading';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const encryptionKey = await window.electron.ipcRenderer.invoke('get-encryption-key');
        setIsAuthenticated(!!encryptionKey);
        
        // Only redirect if we're not already on the correct route
        if (encryptionKey) {
          if (location.pathname === '/login') {
            navigate('/chat/default', { replace: true });
          }
        } else {
          if (location.pathname !== '/login') {
            navigate('/login', { replace: true });
          }
        }
      } catch (error) {
        console.error('Failed to check authentication:', error);
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, location.pathname]);

  // Listen for authentication state changes
  useEffect(() => {
    const handleAuthChange = async () => {
      const encryptionKey = await window.electron.ipcRenderer.invoke('get-encryption-key');
      setIsAuthenticated(!!encryptionKey);
      
      if (!encryptionKey) {
        navigate('/login', { replace: true });
      }
    };

    window.electron.ipcRenderer.on('auth-state-changed', handleAuthChange);
    return () => {
      window.electron.ipcRenderer.on('auth-state-changed', handleAuthChange);
    };
  }, [navigate]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="h-screen flex">
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/chat/default" replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/chat/*"
          element={
            isAuthenticated ? (
              <Chat />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            isAuthenticated ? (
              <Settings />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/chat/default" : "/login"} replace />} />
      </Routes>
    </div>
  );
};

export default App; 