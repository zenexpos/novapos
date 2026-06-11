
class IpcValidator {
    validatePrintData(data) {
        if (!data || typeof data !== 'object') return false;
        // Basic requirement for POS: Invoice number must exist
        return !!data.invoiceNumber;
    }

    isSafeUrl(url) {
        if (typeof url !== 'string') return false;
        const allowedPrefixes = ['https://iposzen.com', 'https://supabase.co'];
        return allowedPrefixes.some(prefix => url.startsWith(prefix));
    }
}

module.exports = IpcValidator;
