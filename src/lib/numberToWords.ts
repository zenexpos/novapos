/**
 * @fileOverview Utility to convert numerical amounts to French words (Comptable).
 * High precision for Dinars and Centimes.
 */

const UNITS  = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const TENS   = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];
const TEENS  = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

function convertGroup(n: number): string {
    if (n === 0) return '';
    let res = '';

    if (n >= 100) {
        const h = Math.floor(n / 100);
        const remainder = n % 100;
        if (h === 1) {
            res += 'cent ';
        } else {
            res += UNITS[h] + (remainder === 0 ? ' cents ' : ' cent ');
        }
        n = remainder;
    }

    if (n === 0) {
        // nothing
    } else if (n >= 20) {
        const t = Math.floor(n / 10);
        const u = n % 10;

        if (t === 8) {
            res += u === 0 ? 'quatre-vingts' : `quatre-vingt-${UNITS[u]}`;
        } else if (t === 7 || t === 9) {
            res += TENS[t - 1] + '-' + (u === 1 ? 'et-' : '') + TEENS[u];
        } else {
            res += TENS[t];
            if (u === 1) res += '-et-un';
            else if (u > 1) res += '-' + UNITS[u];
        }
    } else if (n >= 10) {
        res += TEENS[n - 10];
    } else {
        res += UNITS[n];
    }

    return res.trim();
}

export function numberToFrenchWords(amount: number): string {
    const roundedAmount = Math.round(amount * 100) / 100;
    
    if (roundedAmount === 0) return 'Zéro Dinars Algériens';
    if (roundedAmount < 0) return 'Moins ' + numberToFrenchWords(Math.abs(roundedAmount));

    const integerPart = Math.floor(roundedAmount);
    const decimalPart = Math.round((roundedAmount - integerPart) * 100);

    let result = '';

    if (integerPart > 0) {
        let n = integerPart;
        const billions  = Math.floor(n / 1_000_000_000);
        n %= 1_000_000_000;
        const millions  = Math.floor(n / 1_000_000);
        n %= 1_000_000;
        const thousands = Math.floor(n / 1_000);
        const units     = n % 1_000;

        if (billions > 0) {
            result += convertGroup(billions) + (billions > 1 ? ' milliards ' : ' milliard ');
        }
        if (millions > 0) {
            result += convertGroup(millions) + (millions > 1 ? ' millions ' : ' million ');
        }
        if (thousands > 0) {
            result += thousands === 1 ? 'mille ' : convertGroup(thousands) + ' mille ';
        }
        if (units > 0) {
            result += convertGroup(units);
        }

        result += integerPart > 1 ? ' Dinars Algériens' : ' Dinar Algérien';
    }

    if (decimalPart > 0) {
        if (result) result += ' et ';
        result += convertGroup(decimalPart) + (decimalPart > 1 ? ' Centimes' : ' Centime');
    }

    return result.charAt(0).toUpperCase() + result.slice(1).trim();
}
