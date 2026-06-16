'use client';

import { db } from '@/lib/db';
import type { DashboardData, DashboardStats, SalesByDay, BreadSummary, DashboardAlert, RecentActivity, TopProduct, DebtAging } from '@/lib/types';
import { startOfDay, endOfDay, format, eachDayOfInterval, differenceInDays, subDays } from 'date-fns';
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

        // Fetch primary datasets with indexed ranges
        const [
            sales,
            prevSales,
            expenses,
            prevExpenses,
            breadOrders,
            recentSales,
            recentPayments,
            recentReturns,
            recentIntakes,
            recentExpenses
        ] = await Promise.all([
            db.sales.where('createdAt').between(start, end, true, true).filter(s => !s.isCancelled).toArray(),
            db.sales.where('createdAt').between(prevStart, prevEnd, true, true).filter(s => !s.isCancelled).toArray(),
            db.expenses.where('expenseDate').between(start, end, true, true).toArray(),
            db.expenses.where('expenseDate').between(prevStart, prevEnd, true, true).toArray(),
            db.bread_orders.where('date').equals(format(new Date(), 'yyyy-MM-dd')).toArray(),
            db.sales.orderBy('createdAt').reverse().limit(10).toArray(),
            db.payments.orderBy('paymentDate').reverse().limit(10).toArray(),
            db.product_returns.orderBy('createdAt').reverse().limit(10).toArray(),
            db.stock_intakes.orderBy('createdAt').reverse().limit(10).toArray(),
            db.expenses.orderBy('expenseDate').reverse().limit(10).toArray()
        ]);

        const calcTotal = (list: any[], field: string) => list.reduce((s, x) => s + safeNumber(x[field]), 0);
        
        const currRev = calcTotal(sales, 'total');
        const prevRev = calcTotal(prevSales, 'total');
        const currExp = calcTotal(expenses, 'amount');
        const prevExp = calcTotal(prevExpenses, 'amount');

        const currProfit = currRev - currExp;
        const prevProfit = prevRev - prevExp;

        // SCALABLE AGGREGATION: Use Cursors to prevent main thread blocking for global stats
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

        // Pass 1: Customers (Dette & Aging)
        // Optimized: only loading required fields and avoiding full table scan where possible
        await db.customers.where('outstandingBalance').above(0.01).each(c => {
            if (c.deletedAt) return;
            const bal = safeNumber(c.outstandingBalance);
            totalOutstandingDebt += bal;
            const days = c.lastActivityDate ? differenceInDays(today, safeToDate(c.lastActivityDate)) : 0;
            if (days <= 7) { debtAging[0].value += bal; debtAging[0].count++; }
            else if (days <= 30) { debtAging[1].value += bal; debtAging[1].count++; }
            else { debtAging[2].value += bal; debtAging[2].count++; }
        });

        // Pass 2: Products (Stock Health & Value)
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
            saleCount: sales.length,
            totalOutstandingDebt: roundFinancial(totalOutstandingDebt),
            totalInventoryValue: roundFinancial(totalInventoryValue),
            averageBasket: sales.length > 0 ? currRev / sales.length : 0,
            profitMargin: currRev > 0 ? (currProfit / currRev) * 100 : 0,
            totalRevenueChange: this.calcTrend(currRev, prevRev),
            netProfitChange: this.calcTrend(currProfit, prevProfit),
            totalExpensesChange: this.calcTrend(currExp, prevExp),
            saleCountChange: this.calcTrend(sales.length, prevSales.length)
        };

        const daysList = eachDayOfInterval({ start, end });
        const salesByDay: SalesByDay[] = daysList.map(d => {
            const dStr = format(d, 'yyyy-MM-dd');
            const daySales = sales.filter(s => format(safeToDate(s.createdAt!), 'yyyy-MM-dd') === dStr);
            const dayExp = expenses.filter(e => format(safeToDate(e.expenseDate), 'yyyy-MM-dd') === dStr);
            const r = calcTotal(daySales, 'total');
            const ex = calcTotal(dayExp, 'amount');
            return { date: format(d, 'dd/MM'), revenue: r, profit: r - ex, expenses: ex };
        });

        const recentActivity: RecentActivity[] = [
            ...recentSales.map(s => ({ id: s.uuid, type: 'sale' as const, title: `Vente #${s.invoiceNumber}`, description: s.customerUuid ? 'Compte Client' : 'Client passage', timestamp: safeToDate(s.createdAt!), amount: s.total, status: 'success' as const })),
            ...recentPayments.map(p => ({ id: p.uuid, type: 'payment' as const, title: 'Paiement Reçu', description: 'Sur dette client', timestamp: safeToDate(p.paymentDate), amount: p.amount, status: 'info' as const })),
            ...recentReturns.map(r => ({ id: r.uuid, type: 'return' as const, title: `Retour #${r.originalInvoiceNumber}`, description: 'Réintégration stock', timestamp: safeToDate(r.createdAt!), amount: r.totalReturnValue, status: 'warning' as const })),
            ...recentIntakes.map(i => ({ id: i.uuid, type: 'intake' as const, title: 'Réception Stock', description: i.invoiceNumber || 'Arrivage', timestamp: safeToDate(i.createdAt!), amount: i.totalValue, status: 'info' as const })),
            ...recentExpenses.map(e => ({ id: e.uuid, type: 'expense' as const, title: `Dépense: ${e.description}`, description: e.category, timestamp: safeToDate(e.expenseDate), amount: e.amount, status: 'error' as const }))
        ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 15);

        const productStats = new Map<string, { qty: number, rev: number, margin: number, name: string }>();
        sales.forEach(s => {
            s.items.forEach(item => {
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
            topCustomers: [], 
            debtAging,
            inventoryHealth: {
                outOfStock,
                lowStock,
                healthy,
                totalValue: roundFinancial(totalInventoryValue)
            },
            kpis: {
                stockRotation: roundFinancial(currRev / (totalInventoryValue || 1)),
                recoveryRate: 0, 
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
