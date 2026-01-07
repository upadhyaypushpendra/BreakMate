import { contextBridge, ipcRenderer } from 'electron';

/**
 * Why invoke instead of send?
- invoke is async and returns values (perfect for get).
- send is fire-and-forget (no return value).
*/

// Define the API surface exposed to renderer
const api = {
  store: {
    get: (key: string) => ipcRenderer.invoke('store-get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('store-set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store-delete', key),
    has: (key: string) => ipcRenderer.invoke('store-has', key),
  },
  autoLaunch: {
    enable: () => ipcRenderer.invoke('auto-launch:enable'),
    disable: () => ipcRenderer.invoke('auto-launch:disable'),
    isEnabled: () => ipcRenderer.invoke('auto-launch:is-enabled'),
  },
  smartPause: {
    isEnabled: () => ipcRenderer.invoke('smart-pause:is-enabled'),
    setEnabled: (enabled: boolean) => ipcRenderer.invoke('smart-pause:set-enabled', enabled),
    getThreshold: () => ipcRenderer.invoke('smart-pause:get-threshold'),
    setThreshold: (threshold: number) => ipcRenderer.invoke('smart-pause:set-threshold', threshold),
  },
};

// Expose protected API to renderer via contextBridge
contextBridge.exposeInMainWorld('api', api);

// Expose ipcRenderer.send for one-way messages (like notifications)
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: string, data: any) => {
      // Whitelist allowed channels for security
      const validChannels = [
        'timer:complete',
        'fullscreen:check',
        'break:skip',
        'break:snooze'
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    on: (channel: string, callback: (event: any, data: any) => void) => {
      const validChannels = [
        'fullscreen:changed',
        'break:start',
        'break:timer-update',
        'break:skipped',
        'break:snoozed',
        'system:locked',
        'system:unlocked',
        'smart-pause:reset-timer',
        'smart-pause:enabled-changed',
        'smart-pause:threshold-changed'
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, callback);
      }
    },
    removeAllListeners: (channel: string) => {
      const validChannels = [
        'fullscreen:changed',
        'break:start',
        'break:timer-update',
        'break:skipped',
        'break:snoozed',
        'system:locked',
        'system:unlocked',
        'smart-pause:reset-timer',
        'smart-pause:enabled-changed',
        'smart-pause:threshold-changed'
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeAllListeners(channel);
      }
    }
  }
});