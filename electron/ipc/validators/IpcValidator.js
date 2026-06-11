
/**
 * iPOS Zen — IPC Data Integrity Validator
 */
class IpcValidator {
    validatePrintData(data) {
        if (!data || typeof data !== 'object') return false;
        
        // POS Requirement: Valid invoice number and at least one item
        const hasInvoice = !!data.invoiceNumber && typeof data.invoiceNumber === 'string';
        const hasItems = Array.isArray(data.items) && data.items.length > 0;
        const hasTotal = typeof data.total === 'number' && data.total >= 0;

        return hasInvoice && hasItems && hasTotal;
    }

    isSafeUrl(url) {
        if (typeof url !== 'string') return false;
        const allowedHosts = ['iposzen.com', 'supabase.co', 'wa.me'];
        try {
            const parsed = new URL(url);
            return allowedHosts.some(host => parsed.hostname.endsWith(host));
        } catch {
            return false;
        }
    }
}

module.exports = IpcValidator;
