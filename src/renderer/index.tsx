import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/index.css';

// Configure future flags for React Router
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter future={router.future}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
); 