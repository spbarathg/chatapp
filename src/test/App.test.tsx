import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../renderer/App';

// Mock the electron IPC
const mockIpcRenderer = {
  invoke: jest.fn(),
  send: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
};

// Mock the window.electron object
(window as any).electron = {
  ipcRenderer: mockIpcRenderer,
};

describe('App Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('renders login screen when not authenticated', async () => {
    // Mock the encryption key response
    mockIpcRenderer.invoke.mockImplementation((channel: string, ...args: any[]) => {
      if (channel === 'get-encryption-key') {
        return null; // This will redirect to login
      }
      return null;
    });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText(/Welcome Back!/i)).toBeInTheDocument();
    });
  });

  it('shows loading screen initially', async () => {
    mockIpcRenderer.invoke.mockImplementation((channel: string, ...args: any[]) => {
      if (channel === 'get-encryption-key') {
        return new Promise(resolve => setTimeout(() => resolve(null), 100));
      }
      return null;
    });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('redirects to chat when authenticated', async () => {
    // Mock the encryption key response
    mockIpcRenderer.invoke.mockImplementation((channel: string, ...args: any[]) => {
      if (channel === 'get-encryption-key') {
        return { key: 'test-key' }; // This will authenticate the user
      }
      if (channel === 'get-data') {
        return []; // Return empty contacts list
      }
      return null;
    });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Wait for loading to finish and check for chat list
    await waitFor(() => {
      expect(screen.getByText(/Chats/i)).toBeInTheDocument();
    });
  });
}); 