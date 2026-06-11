
const { BrowserWindow, shell } = require('electron');
const path = require('path');

class WindowManager {
    constructor() {
        this.mainWindow = null;
        this.customerDisplay = null;
    }

    createMainWindow(isDev) {
        this.mainWindow = new BrowserWindow({
            width: 1360,
            height: 768,
            minWidth: 1024,
            minHeight: 600,
            autoHideMenuBar: true,
            icon: path.join(__dirname, '../../public/icons/icon-512x512.png'),
            title: 'iPOS Zen — Elite Ledger',
            backgroundColor: '#F8FAFC',
            webPreferences: {
                preload: path.join(__dirname, '../preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true, // تفعيل بيئة الرمل للأمان
                webSecurity: true,
            },
        });

        if (isDev) {
            this.mainWindow.loadURL(process.env.ELECTRON_DEV_URL || 'http://localhost:3000');
            this.mainWindow.webContents.openDevTools({ mode: 'detach' });
        } else {
            this.mainWindow.loadFile(path.join(__dirname, '../../out/index.html'));
        }

        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            if (url.startsWith('http')) shell.openExternal(url);
            return { action: 'deny' };
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        return this.mainWindow;
    }

    // دعم شاشة العميل (Pole Display / Secondary Monitor)
    createCustomerDisplay() {
        // منطق إنشاء نافذة ثانية لعرض السعر للعميل
    }
}

module.exports = WindowManager;
