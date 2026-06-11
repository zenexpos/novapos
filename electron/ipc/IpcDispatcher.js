
const { ipcMain } = require('electron');
const IpcValidator = require('./validators/IpcValidator');

class IpcDispatcher {
    constructor(windowManager, hardware, logger) {
        this.windowManager = windowManager;
        this.hardware = hardware;
        this.logger = logger;
        this.validator = new IpcValidator();
    }

    register() {
        // Safe Printing
        ipcMain.on('print-receipt', (event, data) => {
            if (this.validator.validatePrintData(data)) {
                this.hardware.printReceipt(data);
                this.logger.audit('PRINT', `Invoice ${data.invoiceNumber} printed`);
            }
        });

        // Cash Drawer Access
        ipcMain.on('open-cash-drawer', () => {
            this.hardware.openDrawer();
            this.logger.audit('SECURITY', 'Cash drawer triggered manually via IPC');
        });

        // External Link Handling
        ipcMain.handle('open-external', async (event, url) => {
            if (this.validator.isSafeUrl(url)) {
                require('electron').shell.openExternal(url);
                return true;
            }
            return false;
        });

        // Printer List
        ipcMain.handle('get-printers', async (event) => {
            return await this.hardware.getPrinters(event.sender);
        });
    }
}

module.exports = IpcDispatcher;
