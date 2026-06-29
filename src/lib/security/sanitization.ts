/**
 * iPOS Zen Security Layer — Input Sanitization & XSS Prevention.
 * Standard protection for POS data entry.
 */

export const sanitizeString = (str: string): string => {
    if (!str) return '';
    return str
        .replace(/[<>]/g, '') // Basic tag removal
        .replace(/javascript:/gi, '') // Simple protocol attack prevention
        .replace(/onclick/gi, '') // Event handler prevention
        .trim();
};

export const sanitizeSearchQuery = (query: string): string => {
    if (!query) return '';
    // Allow alphanumeric, spaces, and basic separators for barcodes/refs
    return query.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();
};

export const escapeHtml = (unsafe: string): string => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};
