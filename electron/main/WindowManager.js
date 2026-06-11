
const { BrowserWindow, shell } = require('electron');
const path = require('path');
const SecurityPolicy = require('./SecurityPolicy');
const { DEFAULT_WIDTH, DEFAULT_HEIGHT, MIN_WIDTH, MIN_HEIGHT } = require('../constants/AppConstants');

class WindowManager {
    constructor() {
        this.mainWindow = null;
    }

    createMainWindow(isDev) {
        this.mainWindow = new BrowserWindow({
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
            minWidth: MIN_WIDTH,
            minHeight: MIN_HEIGHT,
            autoHideMenuBar: true,
            icon: path.join(__dirname, '../../public/icons/icon-512x512.png'),
            title: 'iPOS Zen — Elite Ledger',
            backgroundColor: '#F8FAFC',
            show: false, // Prevent flickering
            webPreferences: {
                preload: path.join(__dirname, '../preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true,
                webSecurity: true,
                spellcheck: false
            },
        });

        SecurityPolicy.apply(this.mainWindow);

        if (isDev) {
            this.mainWindow.loadURL(process.env.ELECTRON_DEV_URL || 'http://localhost:3000');
            this.mainWindow.webContents.openDevTools({ mode: 'detach' });
        } else {
            this.mainWindow.loadFile(path.join(__dirname, '../../out/index.html'));
        }

        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
        });

        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            if (url.startsWith('https://iposzen.com')) {
                shell.openExternal(url);
            }
            return { action: 'deny' };
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        return this.mainWindow;
    }
}

module.exports = WindowManager;
