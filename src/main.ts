import { app, BrowserWindow, ipcMain, session } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';

const isDev = process.env.NODE_ENV === 'development';

type StoreKey = 'encryptionKey' | 'contacts';
const store = new Store();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  console.log('Creating window...');
  
  const preloadPath = isDev
    ? path.join(__dirname, 'preload.js')
    : path.join(__dirname, 'preload.js');
  
  console.log('Preload script path:', preloadPath);
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: preloadPath,
    },
    backgroundColor: '#1a1a1a'
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3007');
    mainWindow.webContents.openDevTools();

    // Watch for changes in the renderer directory
    const rendererDir = path.join(__dirname, '..', 'renderer');
    try {
      if (!fs.existsSync(rendererDir)) {
        fs.mkdirSync(rendererDir, { recursive: true });
      }
      fs.watch(rendererDir, { recursive: true }, (eventType, filename) => {
        if (mainWindow && filename) {
          mainWindow.webContents.reload();
        }
      });
    } catch (error) {
      console.error('Error setting up renderer directory watch:', error);
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }

  // Set Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self';",
          "script-src 'self' 'unsafe-inline';",
          "style-src 'self' 'unsafe-inline';",
          "img-src 'self' data: https:;",
          "connect-src 'self';"
        ].join(' ')
      }
    });
  });

  // Handle window state
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-state-change', 'maximized');
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-state-change', 'normal');
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when app is ready
app.whenReady().then(() => {
  console.log('App is ready, creating window...');
  console.log('Development mode:', isDev);
  console.log('Current directory:', __dirname);
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch(error => {
  console.error('Error during app initialization:', error);
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle IPC events
ipcMain.on('save-settings', (_event, settings) => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  mainWindow?.webContents.send('settings-updated', settings);
});

ipcMain.on('load-settings', (_event) => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    mainWindow?.webContents.send('settings-updated', settings);
  } catch (error) {
    console.error('Error loading settings:', error);
  }
});

// IPC handlers for data storage
ipcMain.handle('set-data', async (event, key: StoreKey, value: any) => {
  store.set(key, value);
});

ipcMain.handle('get-data', async (event, key: StoreKey) => {
  return store.get(key);
});

// Handle secure storage of encryption keys
ipcMain.handle('store-encryption-key', async (_event, data: { key: any }) => {
  try {
    console.log('Storing encryption key');
    store.set('encryptionKey', data.key);
    return true;
  } catch (error) {
    console.error('Error storing encryption key:', error);
    throw error;
  }
});

ipcMain.handle('get-encryption-key', async () => {
  try {
    console.log('Getting encryption key');
    const key = store.get('encryptionKey');
    return key;
  } catch (error) {
    console.error('Error getting encryption key:', error);
    return null;
  }
});

ipcMain.handle('clear-encryption-key', async () => {
  try {
    console.log('Clearing encryption key');
    store.delete('encryptionKey');
    return true;
  } catch (error) {
    console.error('Error clearing encryption key:', error);
    throw error;
  }
});

// IPC handlers
ipcMain.handle('get-is-dev', () => isDev);

ipcMain.handle('delete-data', async (event, key: StoreKey) => {
  store.delete(key);
});

// Add handlers for user validation and app closing
ipcMain.handle('validate-user', async (_event, { username }) => {
  const validUsers = ['tanish', 'joseph', 'barath', 'yashas'];
  return validUsers.includes(username);
});

ipcMain.handle('validate-secret-key', async (_event, { username, key }) => {
  // For development, accept any non-empty key
  return key && key.length > 0;
});

ipcMain.handle('close-app', async () => {
  app.quit();
});