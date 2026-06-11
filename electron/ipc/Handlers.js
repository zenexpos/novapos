
const { ipcMain, shell } = require('electron');

class IpcHandlers {
    constructor(windowManager, hardwareService) {
        this.windowManager = windowManager;
        this.hardware = hardwareService;
    }

    register() {
        // Ouvrir les liens externes en toute sécurité
        ipcMain.handle('open-external', async (event, url) => {
            if (typeof url === 'string' && url.startsWith('http')) {
                await shell.openExternal(url);
                return true;
            }
            return false;
        });

        // Récupérer la liste des imprimantes connectées
        ipcMain.handle('get-printers', async (event) => {
            return await this.hardware.getPrinters(event.sender);
        });

        // Traitement des demandes d'impression
        ipcMain.on('print-receipt', (event, saleData) => {
            this.hardware.printESC(saleData);
        });

        // Ouverture du tiroir-caisse
        ipcMain.on('open-cash-drawer', () => {
            this.hardware.openCashDrawer();
        });
    }
}

module.exports = IpcHandlers;
