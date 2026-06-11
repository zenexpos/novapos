
const { app } = require('electron');
const WindowManager = require('./WindowManager');
const IpcDispatcher = require('../ipc/IpcDispatcher');
const HardwareService = require('../services/HardwareService');
const Logger = require('../services/Logger');

/**
 * iPOS Bootstrapper
 * Coordinates initialization of system logs, hardware, and IPC before launching the UI.
 */
class AppStartup {
    constructor() {
        this.logger = new Logger();
        this.windowManager = new WindowManager();
        this.hardware = new HardwareService(this.logger);
    }

    init() {
        app.whenReady().then(() => {
            this.logger.info('--- System Boot Sequence ---');
            
            // 1. Initialize Hardware Abstraction Layer
            this.hardware.init();

            // 2. Setup IPC Messaging Bridge
            const dispatcher = new IpcDispatcher(this.windowManager, this.hardware, this.logger);
            dispatcher.register();

            // 3. Launch UI Window
            const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
            this.windowManager.createMainWindow(isDev);
            
            this.logger.info('UI Window ready');
        });
    }
}

module.exports = AppStartup;
