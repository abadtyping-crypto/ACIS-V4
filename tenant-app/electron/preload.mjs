import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld(
    'electron', {
    windowControls: {
        minimize: () => ipcRenderer.send('window-minimize'),
        maximize: () => ipcRenderer.send('window-maximize'),
        close: () => ipcRenderer.send('window-close')
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
