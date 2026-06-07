const { contextBridge, ipcRenderer } = require('electron');

// Expose seulement les APIs nécessaires au renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Informations sur la plateforme
    platform: process.platform,
    isElectron: true,

    // Utilitaires système (extensible selon les besoins)
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
