/**
 * iPOS Zen Security Layer — Input Sanitization & XSS Prevention.
 * Standard protection for POS data entry.
 */

export const sanitizeString = (str: string): string => {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/[<>]/g, '') // Basic tag removal
        .replace(/javascript:/gi, '') // Protocol attack prevention
        .replace(/onclick/gi, '') // Event handler prevention
        .replace(/on\w+=/gi, '') // Any onAttribute handlers
        .trim();
};

/**
 * Robust HTML escaping for output rendering.
 */
export const escapeHtml = (unsafe: string): string => {
    if (!unsafe || typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

/**
 * Sanitizes search queries to allow only safe characters for barcodes and names.
 */
export const sanitizeSearchQuery = (query: string): string => {
    if (!query) return '';
    return query.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();
};
