import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import Store from 'electron-store';

// Initialize electron store
const store = new Store();

let mainWindow: BrowserWindow | null = null;

// Valid users and their secret keys
const VALID_USERS = ['tanish', 'joseph', 'barath', 'yashas'];
const USER_KEYS: { [key: string]: string } = {
  tanish: 'key123',
  joseph: 'key456',
  barath: 'key789',
  yashas: 'key101'
};

// Register IPC handlers
const registerIpcHandlers = () => {
  console.log('Registering IPC handlers...');
  
  // First remove any existing handlers to prevent duplicates
  ipcMain.removeHandler('store-encryption-key');
  ipcMain.removeHandler('get-encryption-key');
  ipcMain.removeHandler('clear-encryption-key');
  ipcMain.removeHandler('get-is-dev');
  ipcMain.removeHandler('set-data');
  ipcMain.removeHandler('get-data');
  ipcMain.removeHandler('delete-data');
  ipcMain.removeHandler('validate-user');
  ipcMain.removeHandler('validate-secret-key');
  ipcMain.removeHandler('close-app');

  console.log('Removed existing handlers');

  // Register handlers
  ipcMain.handle('validate-user', async (event, { username }) => {
    try {
      console.log('Validating user:', username);
      const isValid = VALID_USERS.includes(username.toLowerCase());
      console.log('User validation result:', isValid);
      return isValid;
    } catch (error) {
      console.error('Failed to validate user:', error);
      throw error;
    }
  });

  ipcMain.handle('validate-secret-key', async (event, { username, key }) => {
    try {
      console.log('Validating secret key for user:', username);
      const expectedKey = USER_KEYS[username.toLowerCase()];
      const isValid = expectedKey === key;
      console.log('Secret key validation result:', isValid);
      return isValid;
    } catch (error) {
      console.error('Failed to validate secret key:', error);
      throw error;
    }
  });

  ipcMain.handle('close-app', () => {
    try {
      console.log('Closing application...');
      app.quit();
      return true;
    } catch (error) {
      console.error('Failed to close app:', error);
      throw error;
    }
  });

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
  console.log('Creating main window...');
  
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
    console.log('Development mode:', isDev);
    console.log('Current directory:', process.cwd());
    console.log('Preload script path:', path.join(__dirname, 'preload.js'));
    mainWindow.loadURL('http://localhost:3006');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(async () => {
  console.log('App is ready');
  
  // Add a small delay to ensure everything is initialized
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  registerIpcHandlers();
  console.log('Creating window...');
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