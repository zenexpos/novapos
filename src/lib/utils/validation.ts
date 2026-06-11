/**
 * @fileOverview Centralized Validation Helpers for iPOS Zen Forms.
 */

export const isValidPhone = (phone: string): boolean => {
    const regex = /^(05|06|07|02)\d{8}$/; // Standard Algerian format
    return regex.test(phone.replace(/\s/g, ''));
};

export const isValidEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

export const isRequired = (val: any): boolean => {
    if (typeof val === 'string') return val.trim().length > 0;
    return val !== null && val !== undefined;
};

export const isValidNIF = (nif: string): boolean => {
    return /^\d{15}$/.test(nif);
};
