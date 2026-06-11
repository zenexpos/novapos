
const { contextBridge, ipcRenderer } = require('electron');

/**
 * iPOS Zen — Secure Bridge (Whitelisted)
 */
const VALID_CHANNELS = {
    SEND: ['print-receipt', 'open-cash-drawer'],
    INVOKE: ['open-external', 'get-printers'],
    RECEIVE: ['printer-error', 'hardware-status']
};

contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    isElectron: true,

    send: (channel, data) => {
        if (VALID_CHANNELS.SEND.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },

    invoke: (channel, ...args) => {
        if (VALID_CHANNELS.INVOKE.includes(channel)) {
            return ipcRenderer.invoke(channel, ...args);
        }
    },

    on: (channel, callback) => {
        if (VALID_CHANNELS.RECEIVE.includes(channel)) {
            const sub = (event, ...args) => callback(...args);
            ipcRenderer.on(channel, sub);
            return () => ipcRenderer.removeListener(channel, sub);
        }
    }
});
