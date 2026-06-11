
const { app } = require('electron');
const AppStartup = require('./main/AppStartup');
const LifecycleManager = require('./main/LifecycleManager');

/**
 * iPOS Zen — Desktop Entry Point
 * Modular entry for enterprise stability.
 */

const startup = new AppStartup();
const lifecycle = new LifecycleManager();

async function init() {
    // Single instance lock
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
        app.quit();
        return;
    }

    startup.init();
    lifecycle.init();
}

init().catch(err => {
    console.error('[Fatal] App Initialization Failed:', err);
    app.quit();
});
