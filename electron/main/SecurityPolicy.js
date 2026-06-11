
const { session } = require('electron');

/**
 * iPOS Zen — Security Hardening
 * Implements strict CSP and permissions.
 */
class SecurityPolicy {
    static apply(window) {
        // 1. Content Security Policy
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

        // 2. Disable unnecessary features
        window.webContents.on('will-navigate', (event) => {
            event.preventDefault();
        });

        // 3. Permission handler
        session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
            const allowedPermissions = ['notifications'];
            if (allowedPermissions.includes(permission)) {
                callback(true);
            } else {
                callback(false);
            }
        });
    }
}

module.exports = SecurityPolicy;
