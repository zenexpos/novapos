
const { contextBridge, ipcRenderer } = require('electron');

/**
 * iPOS Zen — Secure Context Bridge
 * Limits access to system APIs via explicit whitelisting.
 */
const ALLOWED_CHANNELS = {
    SEND: ['print-receipt', 'open-cash-drawer'],
    INVOKE: ['open-external', 'get-printers'],
    ON: ['printer-error', 'hardware-status']
};

contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    isElectron: true,

    /**
     * Send fire-and-forget message
     */
    send: (channel, data) => {
        if (ALLOWED_CHANNELS.SEND.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },

    /**
     * Invoke asynchronous request (Promise)
     */
    invoke: (channel, ...args) => {
        if (ALLOWED_CHANNELS.INVOKE.includes(channel)) {
            return ipcRenderer.invoke(channel, ...args);
        }
    },

    /**
     * Subscribe to backend events
     */
    on: (channel, callback) => {
        if (ALLOWED_CHANNELS.ON.includes(channel)) {
            const subscription = (event, ...args) => callback(...args);
            ipcRenderer.on(channel, subscription);
            
            // Return cleanup function
            return () => ipcRenderer.removeListener(channel, subscription);
        }
    }
});
