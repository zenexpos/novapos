
const { ALLOWED_HOSTS } = require('../../constants/AppConstants');

/**
 * iPOS Zen — IPC Data Integrity Validator
 * Prevents UI-to-System injection attacks.
 */
class IpcValidator {
    validatePrintData(data) {
        if (!data || typeof data !== 'object') return false;
        
        // POS Requirement: Valid invoice number and list of items
        const hasInvoice = !!data.invoiceNumber && typeof data.invoiceNumber === 'string';
        const hasItems = Array.isArray(data.items) && data.items.length > 0;
        const hasTotal = typeof data.total === 'number';

        return hasInvoice && hasItems && hasTotal;
    }

    isSafeUrl(url) {
        if (typeof url !== 'string') return false;
        try {
            const parsed = new URL(url);
            return ALLOWED_HOSTS.some(host => parsed.hostname.endsWith(host));
        } catch {
            return false;
        }
    }
}

module.exports = IpcValidator;
