/**
 * iPOS Zen — Centralized Enterprise Configuration.
 * Pro-grade settings for financial precision, sync intervals, and environment.
 */

export const APP_CONFIG = {
    name: 'iPOS Zen',
    version: '2.9.5',
    edition: 'Sovereign Elite',
    company: 'iPOS Zen Team',
    domain: 'iposzen.com',
    
    offline: {
        dbName: 'iPOSDatabase',
        dbVersion: 15,
        syncIntervalMs: 5 * 60 * 1000, // 5 minutes
        backupReminderDays: 7,
    },
    
    pwa: {
        manifestPath: '/manifest.webmanifest',
        themeColor: '#AFB42B',
        backgroundColor: '#F8FAFC',
    },

    financial: {
        defaultTvaRate: 19,
        precision: 2,
        currency: 'DA',
        zakatRate: 0.025,
        nisabGoldGrams: 85,
    }
};
