
const { ipcMain, shell } = require('electron');

class IpcHandlers {
    constructor(windowManager, hardwareService) {
        this.windowManager = windowManager;
        this.hardware = hardwareService;
    }

    register() {
        // فتح الروابط الخارجية بأمان
        ipcMain.handle('open-external', async (event, url) => {
            if (typeof url === 'string' && url.startsWith('http')) {
                await shell.openExternal(url);
                return true;
            }
            return false;
        });

        // جلب قائمة الطابعات المتصلة
        ipcMain.handle('get-printers', async (event) => {
            return await this.hardware.getPrinters(event.sender);
        });

        // معالجة طلبات الطباعة
        ipcMain.on('print-receipt', (event, saleData) => {
            this.hardware.printESC(saleData);
        });

        // فتح درج النقد
        ipcMain.on('open-cash-drawer', () => {
            this.hardware.openCashDrawer();
        });
    }
}

module.exports = IpcHandlers;
