
const { app } = require('electron');

/**
 * iPOS Application Lifecycle Watcher
 */
class LifecycleManager {
    init() {
        // Enforce Single Instance (Data Safety)
        const gotTheLock = app.requestSingleInstanceLock();
        if (!gotTheLock) {
            console.error('[Lifecycle] Multiple instance blocked.');
            app.quit();
            return;
        }

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') app.quit();
        });

        app.on('activate', () => {
            // Restore window if icon is clicked on macOS
        });
    }
}

module.exports = LifecycleManager;
