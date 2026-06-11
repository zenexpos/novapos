
const { contextBridge, ipcRenderer } = require('electron');

/**
 * iPOS Zen — Secure Preload Bridge
 * يستخدم نظام Whitelist لضمان عدم وصول المتصفح إلى أوامر نظامية غير مصرح بها.
 */

const VALID_CHANNELS = {
    SEND: ['print-receipt', 'open-cash-drawer', 'scan-barcode'],
    INVOKE: ['open-external', 'get-system-status', 'get-printers'],
    RECEIVE: ['barcode-scanned', 'printer-error', 'sync-status']
};

contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    isElectron: true,

    // أوامر الإرسال (Fire and Forget)
    send: (channel, data) => {
        if (VALID_CHANNELS.SEND.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },

    // أوامر الاستدعاء (Promise-based)
    invoke: (channel, ...args) => {
        if (VALID_CHANNELS.INVOKE.includes(channel)) {
            return ipcRenderer.invoke(channel, ...args);
        }
    },

    // استقبال الأحداث من الـ Main Process
    on: (channel, callback) => {
        if (VALID_CHANNELS.RECEIVE.includes(channel)) {
            const subscription = (event, ...args) => callback(...args);
            ipcRenderer.on(channel, subscription);
            return () => ipcRenderer.removeListener(channel, subscription);
        }
    }
});
