
const { app } = require('electron');
const AppStartup = require('./main/AppStartup');
const LifecycleManager = require('./main/LifecycleManager');

/**
 * iPOS Zen — Titanium Desktop Entry Point
 * Production-ready modular bootstrap.
 */

const startup = new AppStartup();
const lifecycle = new LifecycleManager();

async function bootstrap() {
    // 1. Enforce single instance lock for data integrity
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
        console.warn('[System] Another instance is already running. Terminating.');
        app.quit();
        return;
    }

    // 2. Init global lifecycle observers
    lifecycle.init();

    // 3. Launch application services and UI
    startup.init();
}

// Global exception handling for main process
process.on('uncaughtException', (err) => {
    console.error('[Fatal Error]:', err);
});

bootstrap().catch(err => {
    console.error('[Bootstrap Error]:', err);
    app.exit(1);
});
