
const PrintService = require('./PrintService');

/**
 * iPOS Hardware Coordinator
 * Manages USB/Serial communication for POS peripherals.
 */
class HardwareService {
    constructor() {
        this.printer = new PrintService();
    }

    init() {
        console.log('[Hardware] Peripherals ready for polling');
    }

    async getPrinters(webContents) {
        return await webContents.getPrintersAsync();
    }

    printReceipt(data) {
        this.printer.printESC(data);
    }

    openDrawer() {
        // Standard ESC/POS pulse for cash drawers: ESC p 0 25 250
        this.printer.sendRaw([27, 112, 0, 25, 250]);
    }
}

module.exports = HardwareService;
