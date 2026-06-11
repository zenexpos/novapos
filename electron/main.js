
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const WindowManager = require('./main/WindowManager');
const LifecycleManager = require('./main/LifecycleManager');
const IpcHandlers = require('./ipc/Handlers');
const HardwareService = require('./services/HardwareService');

/**
 * iPOS Zen — Main Process Entry Point (Production Ready)
 * يتبع معايير فصل المسؤوليات لضمان استقرار النظام.
 */

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

async function startApp() {
    // 1. تهيئة إدارة النوافذ
    const windowManager = new WindowManager();
    
    // 2. تهيئة خدمات الأجهزة (طابعات، ماسحات)
    const hardware = new HardwareService();
    hardware.init();

    // 3. تسجيل معالجات IPC
    const handlers = new IpcHandlers(windowManager, hardware);
    handlers.register();

    // 4. إنشاء النافذة الرئيسية
    app.whenReady().then(() => {
        windowManager.createMainWindow(isDev);
        
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) windowManager.createMainWindow(isDev);
        });
    });

    // 5. إدارة دورة حياة التطبيق
    const lifecycle = new LifecycleManager();
    lifecycle.init();
}

startApp().catch(err => {
    console.error('[iPOS Main] Fatal Startup Error:', err);
    app.quit();
});
