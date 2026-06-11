'use client';

import { db } from '@/lib/db';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { safeNumber, roundFinancial, preciseMultiply } from '@/lib/utils';

/**
 * ReportsService — محرك التحليل الإحصائي المتقدم.
 */
class ReportsService {
    
    async getInventoryValuation() {
        const products = await db.products.toArray();
        let totalCostCents = 0;
        let totalRetailCents = 0;

        products.forEach(p => {
            const qty = safeNumber(p.quantity);
            if (qty > 0) {
                totalCostCents += Math.round(preciseMultiply(qty, safeNumber(p.purchasePrice)) * 100);
                totalRetailCents += Math.round(preciseMultiply(qty, safeNumber(p.price)) * 100);
            }
        });

        return {
            atCost: totalCostCents / 100,
            atRetail: totalRetailCents / 100,
            potentialProfit: (totalRetailCents - totalCostCents) / 100
        };
    }

    async getPeriodPerformance(days = 30) {
        const start = startOfDay(subDays(new Date(), days - 1));
        const end = endOfDay(new Date());

        const [sales, expenses, payments] = await Promise.all([
            db.sales.where('createdAt').between(start, end, true, true).filter(s => !s.isCancelled).toArray(),
            db.expenses.where('expenseDate').between(start, end, true, true).toArray(),
            db.payments.where('paymentDate').between(start, end, true, true).toArray()
        ]);

        const revenue = sales.reduce((sum, s) => sum + safeNumber(s.total), 0);
        const cashRevenue = sales.reduce((sum, s) => sum + safeNumber(s.amountPaid), 0);
        const debtRecovered = payments.reduce((sum, p) => sum + safeNumber(p.amount), 0);
        const outgoings = expenses.reduce((sum, e) => sum + safeNumber(e.amount), 0);

        const totalCashIn = cashRevenue + debtRecovered;

        return {
            revenue: roundFinancial(revenue),
            cashFlow: roundFinancial(totalCashIn - outgoings),
            totalIn: roundFinancial(totalCashIn),
            totalOut: roundFinancial(outgoings),
            expenseRatio: revenue > 0 ? (outgoings / revenue) * 100 : 0
        };
    }
}

export const reportsService = new ReportsService();
