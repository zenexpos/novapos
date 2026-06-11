
const PrintService = require('./PrintService');

/**
 * iPOS Hardware Coordinator
 * Manages communication with POS peripherals (USB/Serial/Net).
 */
class HardwareService {
    constructor(logger) {
        this.logger = logger;
        this.printer = new PrintService(logger);
    }

    init() {
        this.logger.info('Hardware coordinator initialized');
    }

    async getPrinters(webContents) {
        try {
            return await webContents.getPrintersAsync();
        } catch (err) {
            this.logger.error('Failed to enumerate system printers');
            return [];
        }
    }

    async printReceipt(data) {
        return await this.printer.printESC(data);
    }

    openDrawer() {
        try {
            this.printer.sendDrawerPulse();
            return true;
        } catch (err) {
            this.logger.error(`Drawer trigger failed: ${err.message}`);
            return false;
        }
    }
}

module.exports = HardwareService;
