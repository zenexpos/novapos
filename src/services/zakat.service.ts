'use client';

import { db } from '@/lib/db';
import { preciseMultiply, safeNumber, roundFinancial, calculateZakat, calculateNisab } from '@/lib/utils';
import { companyProfileService } from './profile.service';
import type { ZakatData } from '@/lib/types';

/**
 * Service Zakat v2 — utilise les fonctions centralisées de utils.ts.
 */
class ZakatService {

    async getZakatData(): Promise<ZakatData> {
        const [products, customers, suppliers, profile] = await Promise.all([
            db.products.toArray(),
            db.customers.toArray(),
            db.suppliers.toArray(),
            companyProfileService.getProfile(),
        ]);

        const inventoryValueCost = products.reduce((sum, p) =>
            sum + (safeNumber(p.quantity) > 0
                ? preciseMultiply(safeNumber(p.quantity), safeNumber(p.purchasePrice))
                : 0),
        0);

        const inventoryValueSale = products.reduce((sum, p) =>
            sum + (safeNumber(p.quantity) > 0
                ? preciseMultiply(safeNumber(p.quantity), safeNumber(p.price))
                : 0),
        0);

        const customerDebts = customers.reduce(
            (sum, c) => sum + safeNumber(c.outstandingBalance), 0,
        );

        const supplierDebts = suppliers.reduce(
            (sum, s) => sum + safeNumber(s.balance), 0,
        );

        const goldPrice = safeNumber(profile?.goldPricePerGram);

        // Actifs nets selon calcul islamique
        const netAssets = roundFinancial(
            inventoryValueCost + customerDebts - supplierDebts
        );

        const nisabThreshold = goldPrice > 0 ? calculateNisab(goldPrice) : null;

        const { due: zakatDue, amount: zakatAmount } = goldPrice > 0
            ? calculateZakat(netAssets, goldPrice)
            : { due: false, amount: 0 };

        return {
            inventoryValueCost: roundFinancial(inventoryValueCost),
            inventoryValueSale: roundFinancial(inventoryValueSale),
            customerDebts:      roundFinancial(customerDebts),
            supplierDebts:      roundFinancial(supplierDebts),
            netAssets,
            nisabThreshold,
            goldPrice,
            zakatAmount,
            zakatDue,
        };
    }
}

export const zakatService = new ZakatService();
