import { contextBridge, ipcRenderer } from 'electron';

type StoreKey = 'encryptionKey' | 'contacts';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    ipcRenderer: {
      send(channel: string, data: any) {
        // whitelist channels
        const validChannels = [
          'save-settings',
          'load-settings',
          'window-control',
          'settings-updated',
          'auth-state-changed',
        ];
        if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, data);
        }
      },
      invoke(channel: string, ...args: any[]) {
        const validChannels = [
          'set-data',
          'get-data',
          'delete-data',
          'get-is-dev',
          'store-encryption-key',
          'get-encryption-key',
          'clear-encryption-key',
        ];
        if (validChannels.includes(channel)) {
          return ipcRenderer.invoke(channel, ...args);
        }
        throw new Error(`Invalid channel: ${channel}`);
      },
      on(channel: string, func: (...args: any[]) => void) {
        const validChannels = [
          'window-state-change',
          'update-available',
          'update-downloaded',
          'settings-updated',
          'auth-state-changed',
        ];
        if (validChannels.includes(channel)) {
          // Deliberately strip event as it includes `sender` 
          const subscription = (event: any, ...args: any[]) => func(...args);
          ipcRenderer.on(channel, subscription);
          return () => {
            ipcRenderer.removeListener(channel, subscription);
          };
        }
      },
      once(channel: string, func: (...args: any[]) => void) {
        const validChannels = [
          'window-state-change',
          'update-available',
          'update-downloaded',
          'settings-updated',
          'auth-state-changed',
        ];
        if (validChannels.includes(channel)) {
          // Deliberately strip event as it includes `sender`
          ipcRenderer.once(channel, (event, ...args) => func(...args));
        }
      },
      removeAllListeners(channel: string) {
        const validChannels = [
          'window-state-change',
          'update-available',
          'update-downloaded',
          'settings-updated',
          'auth-state-changed',
        ];
        if (validChannels.includes(channel)) {
          ipcRenderer.removeAllListeners(channel);
        }
      }
    },
  }
); 