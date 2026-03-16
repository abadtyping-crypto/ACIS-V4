import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld(
    'electron', {
    windowControls: {
        minimize: () => ipcRenderer.send('window-minimize'),
        maximize: () => ipcRenderer.send('window-maximize'),
        close: () => ipcRenderer.send('window-close'),
        getIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
        onMaximizedChange: (callback) => {
            if (typeof callback !== 'function') return () => {};
            const listener = (_event, value) => callback(Boolean(value));
            ipcRenderer.on('window-maximized-change', listener);
            return () => ipcRenderer.removeListener('window-maximized-change', listener);
        },
    },
    mail: {
        send: (payload) => ipcRenderer.invoke('mail-send', payload),
        authStart: (config) => ipcRenderer.invoke('mail-auth-start', config),
    },
    desktopAppearance: {
        saveWallpaper: (payload) => ipcRenderer.invoke('desktop-wallpaper-save', payload),
    },
    onSyncEvent: (callback) => ipcRenderer.on('sync-event', (event, data) => callback(data))
}
);
