import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import Store from 'electron-store';

// Initialize electron store
const store = new Store();

let mainWindow: BrowserWindow | null = null;

// Register IPC handlers
const registerIpcHandlers = () => {
  // First remove any existing handlers to prevent duplicates
  ipcMain.removeHandler('store-encryption-key');
  ipcMain.removeHandler('get-encryption-key');
  ipcMain.removeHandler('clear-encryption-key');
  ipcMain.removeHandler('get-is-dev');
  ipcMain.removeHandler('set-data');
  ipcMain.removeHandler('get-data');
  ipcMain.removeHandler('delete-data');

  // Register handlers
  ipcMain.handle('store-encryption-key', async (event, { key }) => {
    try {
      store.set('encryption-key', key);
      return true;
    } catch (error) {
      console.error('Failed to store encryption key:', error);
      throw error;
    }
  });

  ipcMain.handle('get-encryption-key', async () => {
    try {
      return store.get('encryption-key');
    } catch (error) {
      console.error('Failed to get encryption key:', error);
      throw error;
    }
  });

  ipcMain.handle('clear-encryption-key', async () => {
    try {
      store.delete('encryption-key');
      return true;
    } catch (error) {
      console.error('Failed to clear encryption key:', error);
      throw error;
    }
  });

  ipcMain.handle('get-is-dev', () => isDev);

  ipcMain.handle('set-data', async (event, key: string, value: any) => {
    try {
      store.set(key, value);
      return true;
    } catch (error) {
      console.error(`Failed to set data for key ${key}:`, error);
      throw error;
    }
  });

  ipcMain.handle('get-data', async (event, key: string) => {
    try {
      return store.get(key);
    } catch (error) {
      console.error(`Failed to get data for key ${key}:`, error);
      throw error;
    }
  });

  ipcMain.handle('delete-data', async (event, key: string) => {
    try {
      store.delete(key);
      return true;
    } catch (error) {
      console.error(`Failed to delete data for key ${key}:`, error);
      throw error;
    }
  });

  console.log('IPC handlers registered successfully');
};

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the index.html of the app.
  if (isDev) {
    mainWindow.loadURL('http://localhost:3005');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Register handlers before the app is ready
registerIpcHandlers();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
}); 