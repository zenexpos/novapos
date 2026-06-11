
const { app } = require('electron');

class LifecycleManager {
    init() {
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') app.quit();
        });

        // منع تشغيل أكثر من نسخة من التطبيق (Single Instance Lock)
        const gotTheLock = app.requestSingleInstanceLock();
        if (!gotTheLock) {
            app.quit();
        }

        // تحسين الأداء عند الخمول
        app.on('browser-window-blur', () => {
            // يمكن تقليل استهلاك المعالج هنا
        });
    }
}

module.exports = LifecycleManager;
