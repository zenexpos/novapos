'use client';

import { db } from '@/lib/db';
import { preciseMultiply, safeNumber, roundFinancial, calculateZakat, calculateNisab } from '@/lib/utils';
import { companyProfileService } from './profile.service';
import type { ZakatData } from '@/lib/types';

/**
 * Service de calcul de la Zakat Enterprise.
 * Analyse les actifs nets (Stock + Créances - Dettes) par rapport au seuil du Nissab.
 */
class ZakatService {

    async getZakatData(): Promise<ZakatData> {
        const [products, customers, suppliers, profile] = await Promise.all([
            db.products.toArray(),
            db.customers.toArray(),
            db.suppliers.toArray(),
            companyProfileService.getProfile(),
        ]);

        // Valorisation du stock au coût PMP
        const inventoryValueCost = products.reduce((sum, p) =>
            sum + (safeNumber(p.quantity) > 0
                ? preciseMultiply(safeNumber(p.quantity), safeNumber(p.purchasePrice))
                : 0),
        0);

        // Valorisation du stock au prix de vente (méthode recommandée par certains savants)
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

        // Actifs nets selon calcul comptable souverain
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
