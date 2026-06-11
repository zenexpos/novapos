
const { app } = require('electron');
const WindowManager = require('./WindowManager');
const IpcDispatcher = require('../ipc/IpcDispatcher');
const HardwareService = require('../services/HardwareService');
const Logger = require('../services/Logger');

class AppStartup {
    constructor() {
        this.windowManager = new WindowManager();
        this.hardware = new HardwareService();
        this.logger = new Logger();
    }

    init() {
        app.whenReady().then(() => {
            this.logger.info('System startup initiated...');
            
            // Initialize Hardware
            this.hardware.init();

            // Setup IPC
            const dispatcher = new IpcDispatcher(this.windowManager, this.hardware, this.logger);
            dispatcher.register();

            // Create Main UI
            this.windowManager.createMainWindow(
                process.env.NODE_ENV === 'development' || process.argv.includes('--dev')
            );
        });
    }
}

module.exports = AppStartup;
