import '@testing-library/jest-dom';

// Mock electron
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(),
    on: jest.fn(),
    whenReady: jest.fn(),
  },
  BrowserWindow: jest.fn(),
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
  },
  session: {
    defaultSession: {
      webRequest: {
        onHeadersReceived: jest.fn(),
      },
    },
  },
}));

// Mock electron-store
jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }));
});

// Mock window.electron
global.window.electron = {
  ipcRenderer: {
    send: jest.fn(),
    invoke: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
  },
}; 