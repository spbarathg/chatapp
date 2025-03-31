export interface IpcRenderer {
  send: (channel: string, data: any) => void;
  invoke: (channel: string, data?: any) => Promise<any>;
  receive: (channel: string, func: Function) => void;
}

declare global {
  interface Window {
    electron: {
      ipcRenderer: IpcRenderer;
    };
  }
} 