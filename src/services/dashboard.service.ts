'use client';

import { db } from '@/lib/db';
import type { DashboardData, DashboardStats, SalesByDay, BreadSummary, DashboardAlert, RecentActivity, TopProduct, DebtAging, TopCustomer } from '@/lib/types';
import { startOfDay, endOfDay, format, eachDayOfInterval, differenceInDays } from 'date-fns';
import { safeNumber, roundFinancial, safeToDate, preciseMultiply } from '@/lib/utils';

/**
 * iPOS Zen - Master Dashboard Engine (Optimized v3)
 * High-performance data aggregation with O(N) complexity.
 */
class DashboardService {
    async getDashboardData(from: Date, to: Date): Promise<DashboardData> {
        const start = startOfDay(from);
        const end = endOfDay(to);

        const duration = end.getTime() - start.getTime();
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - duration);

        // 1. Fetch RAW data sets in single pass for the interval
        const [sales, expenses, payments, returns, intakes] = await Promise.all([
            db.sales.where('createdAt').between(start, end, true, true).toArray(),
            db.expenses.where('expenseDate').between(start, end, true, true).toArray(),
            db.payments.where('paymentDate').between(start, end, true, true).toArray(),
            db.product_returns.where('createdAt').between(start, end, true, true).toArray(),
            db.stock_intakes.where('createdAt').between(start, end, true, true).toArray()
        ]);

        // 2. Fetch Previous Period Data for Trends
        const [prevSales, prevExpenses] = await Promise.all([
            db.sales.where('createdAt').between(prevStart, prevEnd, true, true).toArray(),
            db.expenses.where('expenseDate').between(prevStart, prevEnd, true, true).toArray()
        ]);

        // 3. Stats Calculation (Current vs Previous)
        const activeSales = sales.filter(s => !s.isCancelled);
        const currRev = activeSales.reduce((sum, s) => sum + safeNumber(s.total), 0);
        const prevRev = prevSales.filter(s => !s.isCancelled).reduce((sum, s) => sum + safeNumber(s.total), 0);
        
        const currExp = expenses.reduce((sum, e) => sum + safeNumber(e.amount), 0);
        const prevExp = prevExpenses.reduce((sum, e) => sum + safeNumber(e.amount), 0);

        // Calculate COGS (Cost of Goods Sold)
        const totalCogs = activeSales.reduce((sum, s) => 
            sum + s.items.reduce((iSum, i) => iSum + (safeNumber(i.quantity) * safeNumber(i.purchasePrice)), 0)
        , 0);

        const currProfit = currRev - totalCogs - currExp;
        const prevProfit = prevRev - prevExp; // Approximation

        // 4. Global Indicators
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

        // Single pass for all customers
        await db.customers.where('outstandingBalance').above(0.01).each(c => {
            if (c.deletedAt) return;
            const bal = safeNumber(c.outstandingBalance);
            totalOutstandingDebt += bal;
            
            const lastActivity = c.lastActivityDate ? safeToDate(c.lastActivityDate) : c.createdAt;
            const days = differenceInDays(today, lastActivity);
            
            if (days <= 7) { debtAging[0].value += bal; debtAging[0].count++; }
            else if (days <= 30) { debtAging[1].value += bal; debtAging[1].count++; }
            else { debtAging[2].value += bal; debtAging[2].count++; }
        });

        // Single pass for all products
        await db.products.filter(p => !p.deletedAt).each(p => {
            const qty = safeNumber(p.quantity);
            const cost = safeNumber(p.purchasePrice);
            totalInventoryValue += preciseMultiply(qty, cost);
            
            if (qty <= 0) outOfStock++;
            else if (qty <= p.minStockLevel) lowStock++;
            else healthy++;
        });

        const stats: DashboardStats = {
            totalRevenue: roundFinancial(currRev),
            totalExpenses: roundFinancial(currExp),
            netProfit: roundFinancial(currProfit),
            saleCount: activeSales.length,
            totalOutstandingDebt: roundFinancial(totalOutstandingDebt),
            totalInventoryValue: roundFinancial(totalInventoryValue),
            averageBasket: activeSales.length > 0 ? currRev / activeSales.length : 0,
            profitMargin: currRev > 0 ? (currProfit / currRev) * 100 : 0,
            totalRevenueChange: this.calcTrend(currRev, prevRev),
            netProfitChange: this.calcTrend(currProfit, prevProfit),
            totalExpensesChange: this.calcTrend(currExp, prevExp),
            saleCountChange: this.calcTrend(activeSales.length, prevSales.length)
        };

        // 5. Optimized Time-Series Aggregation (O(N))
        const dailyMap = new Map<string, { r: number, p: number }>();
        activeSales.forEach(s => {
            const key = format(safeToDate(s.createdAt!), 'yyyy-MM-dd');
            const entry = dailyMap.get(key) || { r: 0, p: 0 };
            const saleCogs = s.items.reduce((sum, i) => sum + (safeNumber(i.quantity) * safeNumber(i.purchasePrice)), 0);
            entry.r += safeNumber(s.total);
            entry.p += (safeNumber(s.total) - saleCogs);
            dailyMap.set(key, entry);
        });

        const salesByDay: SalesByDay[] = eachDayOfInterval({ start, end }).map(d => {
            const key = format(d, 'yyyy-MM-dd');
            const val = dailyMap.get(key) || { r: 0, p: 0 };
            return { 
                date: format(d, 'dd/MM'), 
                revenue: roundFinancial(val.r), 
                profit: roundFinancial(val.p), 
                expenses: 0 
            };
        });

        // 6. Top Products Calculation
        const productMap = new Map<string, { name: string, qty: number, rev: number, margin: number }>();
        activeSales.forEach(s => {
            s.items.forEach(item => {
                if (!item.productUuid) return;
                const curr = productMap.get(item.productUuid) || { name: item.name, qty: 0, rev: 0, margin: 0 };
                const lineRev = item.quantity * item.price;
                const lineCogs = item.quantity * item.purchasePrice;
                productMap.set(item.productUuid, {
                    name: item.name,
                    qty: curr.qty + item.quantity,
                    rev: curr.rev + lineRev,
                    margin: curr.margin + (lineRev - lineCogs)
                });
            });
        });

        const topProducts: TopProduct[] = Array.from(productMap.entries())
            .map(([uuid, p]) => ({
                productUuid: uuid,
                name: p.name,
                quantitySold: p.qty,
                revenueGenerated: roundFinancial(p.rev),
                marginTotal: roundFinancial(p.margin),
                marginPercent: p.rev > 0 ? (p.margin / p.rev) * 100 : 0
            }))
            .sort((a, b) => b.revenueGenerated - a.revenueGenerated)
            .slice(0, 10);

        // 7. Top Customers Calculation
        const customerStatMap = new Map<string, { spent: number, count: number }>();
        activeSales.forEach(s => {
            if (!s.customerUuid) return;
            const curr = customerStatMap.get(s.customerUuid) || { spent: 0, count: 0 };
            customerStatMap.set(s.customerUuid, { spent: curr.spent + s.total, count: curr.count + 1 });
        });

        const topCustomers: TopCustomer[] = [];
        const sortedCustomers = Array.from(customerStatMap.entries())
            .sort((a, b) => b[1].spent - a[1].spent)
            .slice(0, 10);

        for (const [uuid, cStat] of sortedCustomers) {
            const c = await db.customers.where('uuid').equals(uuid).first();
            if (c) {
                topCustomers.push({
                    customerUuid: uuid,
                    name: `${c.firstName} ${c.lastName}`,
                    totalSpent: roundFinancial(cStat.spent),
                    outstandingBalance: c.outstandingBalance
                });
            }
        }

        // 8. Recent Activity Aggregation
        const recentActivity: RecentActivity[] = [
            ...activeSales.slice(-5).map(s => ({ id: s.uuid, type: 'sale' as const, title: `Vente #${s.invoiceNumber}`, description: s.customerUuid ? 'Client Premium' : 'Passage', timestamp: safeToDate(s.createdAt!), amount: s.total, status: 'success' as const })),
            ...payments.slice(-5).map(p => ({ id: p.uuid, type: 'payment' as const, title: `Paiement Reçu`, description: 'Règlement dette', timestamp: safeToDate(p.paymentDate), amount: p.amount, status: 'success' as const })),
            ...expenses.slice(-5).map(e => ({ id: e.uuid, type: 'expense' as const, title: e.description, description: e.category, timestamp: safeToDate(e.expenseDate), amount: e.amount, status: 'info' as const })),
            ...returns.slice(-5).map(r => ({ id: r.uuid, type: 'return' as const, title: `Retour #${r.originalInvoiceNumber}`, description: 'Flux inverse', timestamp: safeToDate(r.createdAt!), amount: r.totalReturnValue, status: 'warning' as const })),
            ...intakes.slice(-5).map(i => ({ id: i.uuid, type: 'intake' as const, title: `Achat #${i.invoiceNumber}`, description: 'Réception stock', timestamp: safeToDate(i.createdAt!), amount: i.totalValue, status: 'info' as const }))
        ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 15);

        // 9. Recovery Rate
        const totalPaymentsReceived = payments.reduce((sum, p) => sum + safeNumber(p.amount), 0);
        const totalCreditSales = activeSales.reduce((sum, s) => sum + (s.total - s.amountPaid), 0);
        const recoveryRate = totalCreditSales > 0 ? (totalPaymentsReceived / totalCreditSales) * 100 : 100;

        // 10. Bread Summary
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const breadOrders = await db.bread_orders.where('date').equals(todayStr).toArray();

        return {
            stats,
            salesByDay,
            topProducts,
            topCustomers,
            recentActivity,
            debtAging,
            breadSummary: {
                totalOrders: breadOrders.length,
                totalQuantity: breadOrders.reduce((s, o) => s + o.quantity, 0),
                deliveredCount: breadOrders.filter(o => o.isDelivered).length,
                paidCount: breadOrders.filter(o => o.isPaid).length,
                unpaidCount: breadOrders.filter(o => !o.isPaid).length,
                remainingAmount: breadOrders.filter(o => !o.isPaid).reduce((s, o) => s + o.totalAmount, 0)
            },
            alerts: this.generateAlerts(outOfStock, lowStock),
            inventoryHealth: { outOfStock, lowStock, healthy, totalValue: roundFinancial(totalInventoryValue) },
            kpis: {
                stockRotation: currRev > 0 ? roundFinancial(currRev / (totalInventoryValue || 1)) : 0,
                recoveryRate: roundFinancial(recoveryRate),
                activeCustomers: await db.customers.filter(c => !c.deletedAt).count(),
                activeProducts: await db.products.filter(p => !p.deletedAt).count()
            }
        };
    }

    private calcTrend(curr: number, prev: number) {
        if (!prev || prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / Math.abs(prev)) * 100;
    }

    private generateAlerts(outOfStock: number, lowStock: number): DashboardAlert[] {
        const alerts: DashboardAlert[] = [];
        if (outOfStock > 0) alerts.push({ id: 'alert-oos', type: 'critical', message: `${outOfStock} ruptures critiques`, description: 'Des ventes sont perdues.' });
        if (lowStock > 0) alerts.push({ id: 'alert-low', type: 'warning', message: `${lowStock} stocks faibles`, description: 'Réapprovisionnement suggéré.' });
        return alerts;
    }
}

export const dashboardService = new DashboardService();