
const { session } = require('electron');

/**
 * iPOS Zen — Hardened Security Layer
 * Implements CSP, permission lockdowns, and navigation controls.
 */
class SecurityPolicy {
    static apply(window) {
        // 1. Content Security Policy (CSP)
        session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': [
                        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://picsum.photos; connect-src 'self' https://*.supabase.co;"
                    ]
                }
            });
        });

        // 2. Restrict Navigation (Anti-Phishing)
        window.webContents.on('will-navigate', (event, url) => {
            if (!url.startsWith('file://') && !url.startsWith('http://localhost')) {
                event.preventDefault();
                console.warn(`Blocked navigation attempt to: ${url}`);
            }
        });

        // 3. System Permission Management
        session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
            const allowed = ['notifications']; // Only allow non-intrusive permissions
            callback(allowed.includes(permission));
        });
    }
}

module.exports = SecurityPolicy;
