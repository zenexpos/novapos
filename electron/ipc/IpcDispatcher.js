
const { ipcMain } = require('electron');
const IpcValidator = require('./validators/IpcValidator');
const { CHANNELS } = require('../constants/AppConstants');

/**
 * iPOS Communication Engine
 * Orchestrates messages between the React UI and system services.
 */
class IpcDispatcher {
    constructor(windowManager, hardware, logger) {
        this.windowManager = windowManager;
        this.hardware = hardware;
        this.logger = logger;
        this.validator = new IpcValidator();
    }

    register() {
        // 1. Secure Receipt Printing
        ipcMain.on(CHANNELS.PRINT_RECEIPT, async (event, data) => {
            if (this.validator.validatePrintData(data)) {
                try {
                    await this.hardware.printReceipt(data);
                    this.logger.audit('PRINT', `Invoice ${data.invoiceNumber} executed`);
                } catch (err) {
                    event.sender.send(CHANNELS.PRINTER_ERROR, err.message);
                }
            } else {
                this.logger.warn(`Rejected invalid print payload for: ${data?.invoiceNumber}`);
                event.sender.send(CHANNELS.PRINTER_ERROR, 'Invalid data format');
            }
        });

        // 2. Cash Drawer (Audit Logged)
        ipcMain.on(CHANNELS.OPEN_DRAWER, (event) => {
            this.hardware.openDrawer();
            this.logger.audit('SECURITY', 'Manual drawer trigger via IPC');
        });

        // 3. Hardware Discovery
        ipcMain.handle(CHANNELS.GET_PRINTERS, async (event) => {
            return await this.hardware.getPrinters(event.sender);
        });

        // 4. Safe External Redirection
        ipcMain.handle(CHANNELS.OPEN_EXTERNAL, async (event, url) => {
            if (this.validator.isSafeUrl(url)) {
                const { shell } = require('electron');
                await shell.openExternal(url);
                return true;
            }
            this.logger.warn(`Blocked suspicious URL navigation: ${url}`);
            return false;
        });
    }
}

module.exports = IpcDispatcher;
