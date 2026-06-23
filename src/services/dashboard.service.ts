'use client';

import { db } from '@/lib/db';
import type { DashboardData, DashboardStats, SalesByDay, BreadSummary, DashboardAlert, RecentActivity, TopProduct, DebtAging, TopCustomer } from '@/lib/types';
import { startOfDay, endOfDay, format, eachDayOfInterval, differenceInDays } from 'date-fns';
import { safeNumber, roundFinancial, safeToDate, preciseMultiply } from '@/lib/utils';

/**
 * iPOS Zen - Optimized Dashboard Service
 * Uses batched cursors and selective counting to avoid main thread starvation.
 */
class DashboardService {
    async getDashboardData(from: Date, to: Date): Promise<DashboardData> {
        const start = startOfDay(from);
        const end = endOfDay(to);

        const duration = end.getTime() - start.getTime();
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - duration);

        // Fetch datasets with indexed cursors for performance
        let currRev = 0;
        let prevRev = 0;
        let currExp = 0;
        let prevExp = 0;
        
        const salesInPeriod: any[] = [];
        const expensesInPeriod: any[] = [];
        const paymentsInPeriod: any[] = [];

        // 1. Current Period Sales
        await db.sales.where('createdAt').between(start, end, true, true).each(s => {
            if (s.isCancelled) return;
            currRev += safeNumber(s.total);
            salesInPeriod.push(s);
        });

        // 2. Previous Period Sales (for trends)
        await db.sales.where('createdAt').between(prevStart, prevEnd, true, true).each(s => {
            if (s.isCancelled) return;
            prevRev += safeNumber(s.total);
        });

        // 3. Expenses
        await db.expenses.where('expenseDate').between(start, end, true, true).each(e => {
            currExp += safeNumber(e.amount);
            expensesInPeriod.push(e);
        });

        await db.expenses.where('expenseDate').between(prevStart, prevEnd, true, true).each(e => {
            prevExp += safeNumber(e.amount);
        });

        // 4. Payments (for Recovery Rate)
        await db.payments.where('paymentDate').between(start, end, true, true).each(p => {
            paymentsInPeriod.push(p);
        });

        const currProfit = currRev - currExp;
        const prevProfit = prevRev - prevExp;

        // SCALABLE GLOBAL AGGREGATION
        let totalOutstandingDebt = 0;
        let totalInventoryValue = 0;
        let outOfStock = 0;
        let lowStock = 0;
        let healthy = 0;
        
        const debtAging: DebtAging[] = [
            { label: 'Récent (0-7j)', value: 0, count: 0 },
            { label: 'Relance (8-30j)', value: 0, count: 0 },
            { label: 'Critique (30j+)', value: 0, count: 0 }
        ];

        const today = new Date();

        // Pass 1: Customers
        await db.customers.where('outstandingBalance').above(0.01).each(c => {
            if (c.deletedAt) return;
            const bal = safeNumber(c.outstandingBalance);
            totalOutstandingDebt += bal;
            const days = c.lastActivityDate ? differenceInDays(today, safeToDate(c.lastActivityDate)) : 0;
            if (days <= 7) { debtAging[0].value += bal; debtAging[0].count++; }
            else if (days <= 30) { debtAging[1].value += bal; debtAging[1].count++; }
            else { debtAging[2].value += bal; debtAging[2].count++; }
        });

        // Pass 2: Products
        await db.products.filter(p => !p.deletedAt).each(p => {
            const qty = safeNumber(p.quantity);
            const cost = safeNumber(p.purchasePrice);
            totalInventoryValue += Math.round(preciseMultiply(qty, cost) * 100) / 100;
            
            if (qty <= 0) outOfStock++;
            else if (qty <= p.minStockLevel) lowStock++;
            else healthy++;
        });

        const stats: DashboardStats = {
            totalRevenue: roundFinancial(currRev),
            totalExpenses: roundFinancial(currExp),
            netProfit: roundFinancial(currProfit),
            saleCount: salesInPeriod.length,
            totalOutstandingDebt: roundFinancial(totalOutstandingDebt),
            totalInventoryValue: roundFinancial(totalInventoryValue),
            averageBasket: salesInPeriod.length > 0 ? currRev / salesInPeriod.length : 0,
            profitMargin: currRev > 0 ? (currProfit / currRev) * 100 : 0,
            totalRevenueChange: this.calcTrend(currRev, prevRev),
            netProfitChange: this.calcTrend(currProfit, prevProfit),
            totalExpensesChange: this.calcTrend(currExp, prevExp),
            saleCountChange: this.calcTrend(salesInPeriod.length, 0)
        };

        // Optimized SalesByDay using Map (O(N) instead of O(N*D))
        const dailyMap = new Map<string, { r: number, ex: number }>();
        salesInPeriod.forEach(s => {
            const key = format(safeToDate(s.createdAt!), 'yyyy-MM-dd');
            const entry = dailyMap.get(key) || { r: 0, ex: 0 };
            entry.r += safeNumber(s.total);
            dailyMap.set(key, entry);
        });
        expensesInPeriod.forEach(e => {
            const key = format(safeToDate(e.expenseDate), 'yyyy-MM-dd');
            const entry = dailyMap.get(key) || { r: 0, ex: 0 };
            entry.ex += safeNumber(e.amount);
            dailyMap.set(key, entry);
        });

        const daysList = eachDayOfInterval({ start, end });
        const salesByDay: SalesByDay[] = daysList.map(d => {
            const key = format(d, 'yyyy-MM-dd');
            const val = dailyMap.get(key) || { r: 0, ex: 0 };
            return { 
                date: format(d, 'dd/MM'), 
                revenue: val.r, 
                profit: val.r - val.ex, 
                expenses: val.ex 
            };
        });

        const [breadOrders, recentSales, recentPayments, recentReturns, recentIntakes, recentExpenses] = await Promise.all([
            db.bread_orders.where('date').equals(format(new Date(), 'yyyy-MM-dd')).toArray(),
            db.sales.orderBy('createdAt').reverse().limit(10).toArray(),
            db.payments.orderBy('paymentDate').reverse().limit(10).toArray(),
            db.product_returns.orderBy('createdAt').reverse().limit(10).toArray(),
            db.stock_intakes.orderBy('createdAt').reverse().limit(10).toArray(),
            db.expenses.orderBy('expenseDate').reverse().limit(10).toArray()
        ]);

        const recentActivity: RecentActivity[] = [
            ...recentSales.map(s => ({ id: s.uuid, type: 'sale' as const, title: `Vente #${s.invoiceNumber}`, description: s.customerUuid ? 'Compte Client' : 'Client passage', timestamp: safeToDate(s.createdAt!), amount: s.total, status: 'success' as const })),
            ...recentPayments.map(p => ({ id: p.uuid, type: 'payment' as const, title: 'Paiement Reçu', description: 'Sur dette client', timestamp: safeToDate(p.paymentDate), amount: p.amount, status: 'info' as const })),
            ...recentReturns.map(r => ({ id: r.uuid, type: 'return' as const, title: `Retour #${r.originalInvoiceNumber}`, description: 'Réintégration stock', timestamp: safeToDate(r.createdAt!), amount: r.totalReturnValue, status: 'warning' as const })),
            ...recentIntakes.map(i => ({ id: i.uuid, type: 'intake' as const, title: 'Réception Stock', description: i.invoiceNumber || 'Arrivage', timestamp: safeToDate(i.createdAt!), amount: i.totalValue, status: 'info' as const })),
            ...recentExpenses.map(e => ({ id: e.uuid, type: 'expense' as const, title: `Dépense: ${e.description}`, description: e.category, timestamp: safeToDate(e.expenseDate), amount: e.amount, status: 'error' as const }))
        ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 15);

        // Top Products Logic
        const productStats = new Map<string, { qty: number, rev: number, margin: number, name: string }>();
        salesInPeriod.forEach(s => {
            s.items.forEach((item: any) => {
                const key = item.productUuid || item.name;
                const curr = productStats.get(key) || { qty: 0, rev: 0, margin: 0, name: item.name };
                curr.qty += item.quantity;
                curr.rev += item.quantity * item.price;
                curr.margin += item.quantity * (item.price - item.purchasePrice);
                productStats.set(key, curr);
            });
        });

        const topProducts: TopProduct[] = Array.from(productStats.entries())
            .map(([uuid, stat]) => ({
                productUuid: uuid,
                name: stat.name,
                quantitySold: stat.qty,
                revenueGenerated: stat.rev,
                marginTotal: stat.margin,
                marginPercent: stat.rev > 0 ? (stat.margin / stat.rev) * 100 : 0
            }))
            .sort((a, b) => b.revenueGenerated - a.revenueGenerated)
            .slice(0, 10);

        // Top Customers Logic (PERIOD BASED)
        const customerStatsMap = new Map<string, { spent: number, name: string, balance: number }>();
        salesInPeriod.forEach(s => {
            if (s.customerUuid) {
                const entry = customerStatsMap.get(s.customerUuid) || { spent: 0, name: 'Chargement...', balance: 0 };
                entry.spent += s.total;
                customerStatsMap.set(s.customerUuid, entry);
            }
        });

        // Resolve names for top customers
        const topCustomersRaw = Array.from(customerStatsMap.entries())
            .sort((a, b) => b[1].spent - a[1].spent)
            .slice(0, 10);
            
        const topCustomers: TopCustomer[] = [];
        for (const [uuid, stats] of topCustomersRaw) {
            const c = await db.customers.where('uuid').equals(uuid).first();
            if (c) {
                topCustomers.push({
                    customerUuid: uuid,
                    name: `${c.firstName} ${c.lastName}`,
                    totalSpent: stats.spent,
                    outstandingBalance: c.outstandingBalance
                });
            }
        }

        // Recovery Rate Calculation
        const totalPayments = paymentsInPeriod.reduce((sum, p) => sum + safeNumber(p.amount), 0);
        const totalCreditCreated = salesInPeriod.reduce((sum, s) => sum + (s.total - s.amountPaid), 0);
        const recoveryRate = totalCreditCreated > 0 ? (totalPayments / totalCreditCreated) * 100 : 100;

        const alerts: DashboardAlert[] = [];
        if (outOfStock > 0) alerts.push({ id: 'alert-oos', type: 'critical', message: `${outOfStock} produits en rupture`, description: 'Ventes perdues potentielles.' });
        if (lowStock > 0) alerts.push({ id: 'alert-low', type: 'warning', message: `${lowStock} seuils d'alerte atteints`, description: 'Réapprovisionnement suggéré.' });

        return {
            stats,
            salesByDay,
            recentActivity,
            breadSummary: {
                totalOrders: breadOrders.length,
                totalQuantity: breadOrders.reduce((s, o) => s + o.quantity, 0),
                deliveredCount: breadOrders.filter(o => o.isDelivered).length,
                paidCount: breadOrders.filter(o => o.isPaid).length,
                unpaidCount: breadOrders.filter(o => !o.isPaid).length,
                remainingAmount: breadOrders.filter(o => !o.isPaid).reduce((s, o) => s + o.totalAmount, 0)
            },
            alerts,
            topProducts,
            topCustomers,
            debtAging,
            inventoryHealth: {
                outOfStock,
                lowStock,
                healthy,
                totalValue: roundFinancial(totalInventoryValue)
            },
            kpis: {
                stockRotation: roundFinancial(currRev / (totalInventoryValue || 1)),
                recoveryRate: roundFinancial(recoveryRate),
                activeCustomers: await db.customers.filter(c => !c.deletedAt).count(),
                activeProducts: await db.products.filter(p => !p.deletedAt).count()
            }
        };
    }

    private calcTrend(curr: number, prev: number) {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / Math.abs(prev)) * 100;
    }
}

export const dashboardService = new DashboardService();