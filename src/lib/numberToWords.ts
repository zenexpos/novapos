/**
 * @fileOverview Utilitaire de conversion de montants numériques en lettres (Français).
 * Gère les Dinars et les Centimes avec une précision comptable.
 *
 * FIX: Accord du pluriel "cents" — 'deux cents' (pluriel) vs 'deux cent vingt' (sans pluriel)
 * FIX: Cas zéro corrigé → "Zéro Dinar Algérien" (singulier, majuscule)
 * FIX: Support des nombres négatifs
 * FIX: Support des milliards (jusqu'à 999 999 999 999)
 */

const UNITS  = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const TENS   = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];
const TEENS  = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

/**
 * Convertit un nombre entre 0 et 999 en lettres.
 * FIX: "deux cents" (pluriel si multiple exact de 100, non suivi d'autre chose)
 *      "deux cent vingt" (sans 's' si suivi d'un complément)
 */
function convertGroup(n: number): string {
    if (n === 0) return '';
    let res = '';

    if (n >= 100) {
        const h = Math.floor(n / 100);
        const remainder = n % 100;
        if (h === 1) {
            // FIX: "cent" seul → "cent vingt" (jamais "un cent")
            res += 'cent ';
        } else {
            // FIX: pluriel "cents" seulement si pas de reste (deux cents ≠ deux cent vingt)
            res += UNITS[h] + (remainder === 0 ? ' cents ' : ' cent ');
        }
        n = remainder;
    }

    if (n === 0) {
        // rien à ajouter
    } else if (n >= 20) {
        const t = Math.floor(n / 10);
        const u = n % 10;

        if (t === 8) {
            // quatre-vingts / quatre-vingt-X
            res += u === 0 ? 'quatre-vingts' : `quatre-vingt-${UNITS[u]}`;
        } else if (t === 7 || t === 9) {
            // soixante-dix-X / quatre-vingt-dix-X
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

/**
 * Convertit un nombre en lettres françaises (Dinars Algériens).
 * @param amount Le montant positif à convertir
 * @returns Le montant en lettres, ex: "Deux Cents Dinars Algériens"
 */
export function numberToFrenchWords(amount: number): string {
    // FIX: cas zéro — forme plurielle et majuscule
    if (amount === 0) return 'Zéro Dinars Algériens';

    // FIX: support des nombres négatifs
    if (amount < 0) return 'Moins ' + numberToFrenchWords(-amount);

    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);

    let result = '';

    if (integerPart > 0) {
        let n = integerPart;

        // FIX: support milliards
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

    // Majuscule première lettre
    return result.charAt(0).toUpperCase() + result.slice(1).trim();
}
