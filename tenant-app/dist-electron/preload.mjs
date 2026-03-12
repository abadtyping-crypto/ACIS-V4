"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld(
  "electron",
  {
    windowControls: {
      minimize: () => electron.ipcRenderer.send("window-minimize"),
      maximize: () => electron.ipcRenderer.send("window-maximize"),
      close: () => electron.ipcRenderer.send("window-close")
    },
    mail: {
      send: (payload) => electron.ipcRenderer.invoke("mail-send", payload),
      authStart: (config) => electron.ipcRenderer.invoke("mail-auth-start", config)
    },
    // We can add specific event subscription methods here later
    onSyncEvent: (callback) => electron.ipcRenderer.on("sync-event", (event, data) => callback(data))
  }
);
