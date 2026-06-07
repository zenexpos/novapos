const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development'
           || process.argv.includes('--dev');

function createWindow() {
    const win = new BrowserWindow({
        width:     1360,
        height:    768,
        minWidth:  1024,
        minHeight: 600,
        autoHideMenuBar: true,
        // FIX: use existing PNG icon instead of missing icon.png
        icon: path.join(__dirname, '../public/icons/icon-512x512.png'),
        title: 'iPOS Zen',
        backgroundColor: '#FFF8E7',
        webPreferences: {
            preload:          path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration:  false,
            webSecurity:      true,
        },
    });

    Menu.setApplicationMenu(null);

    if (isDev) {
        const devUrl = process.env.ELECTRON_DEV_URL || 'http://localhost:3000';
        win.loadURL(devUrl).catch(() => {
            win.loadURL('http://localhost:3001').catch((err) => {
                console.error('Failed to load dev server:', err);
            });
        });
        // DevTools only in dev mode
        win.webContents.openDevTools({ mode: 'detach' });
    } else {
        win.loadFile(path.join(__dirname, '../out/index.html'));
    }

    // External links → system browser
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });
}

// FIX: Register missing IPC handler for open-external (was called in preload but never handled)
ipcMain.handle('open-external', (_event, url) => {
    if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
        return shell.openExternal(url);
    }
});

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
