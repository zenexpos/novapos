import { createClient, SupabaseClient } from '@supabase/supabase-js';

// FIX: Cache the client — previously a new instance was created on every call,
// causing multiplied open connections. Reset cache when url/key change.
let _cachedClient: SupabaseClient | null = null;
let _cachedUrl = '';
let _cachedKey = '';

export const getSupabaseClient = (url: string, key: string): SupabaseClient | null => {
    if (!url || !key) return null;
    const trimmedUrl = url.trim();
    const trimmedKey = key.trim();

    // Return cached instance if credentials haven't changed
    if (_cachedClient && trimmedUrl === _cachedUrl && trimmedKey === _cachedKey) {
        return _cachedClient;
    }

    // Create new instance and cache it
    _cachedClient = createClient(trimmedUrl, trimmedKey);
    _cachedUrl = trimmedUrl;
    _cachedKey = trimmedKey;
    return _cachedClient;
};

// Call this when credentials are cleared/changed to force a new client next time
export const resetSupabaseClient = () => {
    _cachedClient = null;
    _cachedUrl   = '';
    _cachedKey   = '';
};
