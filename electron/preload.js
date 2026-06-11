
const { contextBridge, ipcRenderer } = require('electron');

/**
 * iPOS Zen — Secure Context Bridge
 * Strictly limits UI access to sensitive system APIs via whitelisting.
 */
const ALLOWED_SEND = ['print-receipt', 'open-cash-drawer'];
const ALLOWED_INVOKE = ['open-external', 'get-printers'];
const ALLOWED_ON = ['printer-error', 'hardware-status'];

contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    isElectron: true,

    /**
     * fire-and-forget messaging
     */
    send: (channel, data) => {
        if (ALLOWED_SEND.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },

    /**
     * Promise-based requests
     */
    invoke: (channel, ...args) => {
        if (ALLOWED_INVOKE.includes(channel)) {
            return ipcRenderer.invoke(channel, ...args);
        }
    },

    /**
     * Backend events listener
     */
    on: (channel, callback) => {
        if (ALLOWED_ON.includes(channel)) {
            const subscription = (event, ...args) => callback(...args);
            ipcRenderer.on(channel, subscription);
            
            return () => ipcRenderer.removeListener(channel, subscription);
        }
    }
});
