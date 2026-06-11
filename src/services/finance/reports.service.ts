'use client';

import { db } from '@/lib/db';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import { safeNumber, roundFinancial, preciseMultiply } from '@/lib/utils';

/**
 * ReportsService — محرك التحليل الإحصائي لـ iPOS Zen.
 * يقوم بتجميع البيانات من جداول المبيعات، المشتريات، والمصاريف لتوليد رؤى تجارية.
 */
class ReportsService {
    
    async getInventoryValuation() {
        const products = await db.products.toArray();
        let totalCost = 0;
        let totalRetail = 0;

        products.forEach(p => {
            const qty = safeNumber(p.quantity);
            if (qty > 0) {
                totalCost += Math.round(preciseMultiply(qty, safeNumber(p.purchasePrice)) * 100);
                totalRetail += Math.round(preciseMultiply(qty, safeNumber(p.price)) * 100);
            }
        });

        return {
            atCost: totalCost / 100,
            atRetail: totalRetail / 100,
            potentialProfit: (totalRetail - totalCost) / 100
        };
    }

    async getPeriodPerformance(days = 30) {
        const start = startOfDay(subDays(new Date(), days));
        const end = endOfDay(new Date());

        const [sales, expenses, payments] = await Promise.all([
            db.sales.where('createdAt').between(start, end, true, true).filter(s => !s.isCancelled).toArray(),
            db.expenses.where('expenseDate').between(start, end, true, true).toArray(),
            db.payments.where('paymentDate').between(start, end, true, true).toArray()
        ]);

        const revenue = sales.reduce((sum, s) => sum + safeNumber(s.total), 0);
        const collected = sales.reduce((sum, s) => sum + safeNumber(s.amountPaid), 0) + 
                          payments.reduce((sum, p) => sum + safeNumber(p.amount), 0);
        const outgoings = expenses.reduce((sum, e) => sum + safeNumber(e.amount), 0);

        return {
            revenue: roundFinancial(revenue),
            cashFlow: roundFinancial(collected - outgoings),
            expenseRatio: revenue > 0 ? (outgoings / revenue) * 100 : 0
        };
    }

    async getTopSellingProducts(limit = 10) {
        const sales = await db.sales.filter(s => !s.isCancelled).toArray();
        const productStats = new Map<string, { name: string, qty: number, revenue: number }>();

        sales.forEach(sale => {
            sale.items.forEach(item => {
                const current = productStats.get(item.name) || { name: item.name, qty: 0, revenue: 0 };
                current.qty += safeNumber(item.quantity);
                current.revenue += preciseMultiply(safeNumber(item.quantity), safeNumber(item.price));
                productStats.set(item.name, current);
            });
        });

        return Array.from(productStats.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);
    }
}

export const reportsService = new ReportsService();
