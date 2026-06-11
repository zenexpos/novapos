
const { ipcMain } = require('electron');
const IpcValidator = require('./validators/IpcValidator');
const { CHANNELS } = require('../constants/AppConstants');

class IpcDispatcher {
    constructor(windowManager, hardware, logger) {
        this.windowManager = windowManager;
        this.hardware = hardware;
        this.logger = logger;
        this.validator = new IpcValidator();
    }

    register() {
        // 1. Secure Receipt Printing
        ipcMain.on(CHANNELS.PRINT_RECEIPT, (event, data) => {
            if (this.validator.validatePrintData(data)) {
                this.hardware.printReceipt(data);
                this.logger.audit('PRINT', `Invoice ${data.invoiceNumber} executed`);
            } else {
                this.logger.error(`Invalid print attempt: ${JSON.stringify(data)}`);
                event.sender.send('printer-error', 'Format de données invalide');
            }
        });

        // 2. Cash Drawer (Protected)
        ipcMain.on(CHANNELS.OPEN_DRAWER, (event) => {
            this.hardware.openDrawer();
            this.logger.audit('SECURITY', 'Manual drawer trigger via IPC');
        });

        // 3. Hardware Discovery
        ipcMain.handle(CHANNELS.GET_PRINTERS, async (event) => {
            return await this.hardware.getPrinters(event.sender);
        });

        // 4. Safe External Links
        ipcMain.handle(CHANNELS.OPEN_EXTERNAL, async (event, url) => {
            if (this.validator.isSafeUrl(url)) {
                const { shell } = require('electron');
                await shell.openExternal(url);
                return true;
            }
            this.logger.warn(`Blocked suspicious URL: ${url}`);
            return false;
        });
    }
}

module.exports = IpcDispatcher;
