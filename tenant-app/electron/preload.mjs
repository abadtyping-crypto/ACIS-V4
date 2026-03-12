import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
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
    // We can add specific event subscription methods here later
    onSyncEvent: (callback) => ipcRenderer.on('sync-event', (event, data) => callback(data))
}
);
