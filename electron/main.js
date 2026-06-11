
const AppStartup = require('./main/AppStartup');
const LifecycleManager = require('./main/LifecycleManager');

/**
 * iPOS Zen — Desktop Core Entry
 * Production-ready modular bootstrap.
 */

const startup = new AppStartup();
const lifecycle = new LifecycleManager();

// Initialize lifecycle observers first
lifecycle.init();

// Boot application services and UI
startup.init();

// Global Exception Safety
process.on('uncaughtException', (err) => {
    console.error('[Main Process Error]:', err);
});
