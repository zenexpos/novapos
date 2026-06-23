'use client';

import { db } from '@/lib/db';
import type { DashboardData, DashboardStats, SalesByDay, BreadSummary, DashboardAlert, RecentActivity, TopProduct, DebtAging, TopCustomer } from '@/lib/types';
import { startOfDay, endOfDay, format, eachDayOfInterval, differenceInDays, isWithinInterval } from 'date-fns';
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
        const [sales, expenses, payments, returns] = await Promise.all([
            db.sales.where('createdAt').between(start, end, true, true).toArray(),
            db.expenses.where('expenseDate').between(start, end, true, true).toArray(),
            db.payments.where('paymentDate').between(start, end, true, true).toArray(),
            db.product_returns.where('createdAt').between(start, end, true, true).toArray()
        ]);

        // 2. Fetch Previous Period Data for Trends
        const [prevSales, prevExpenses] = await Promise.all([
            db.sales.where('createdAt').between(prevStart, prevEnd, true, true).toArray(),
            db.expenses.where('expenseDate').between(prevStart, prevEnd, true, true).toArray()
        ]);

        // 3. Stats Calculation (Current vs Previous)
        const currRev = sales.filter(s => !s.isCancelled).reduce((sum, s) => sum + safeNumber(s.total), 0);
        const prevRev = prevSales.filter(s => !s.isCancelled).reduce((sum, s) => sum + safeNumber(s.total), 0);
        
        const currExp = expenses.reduce((sum, e) => sum + safeNumber(e.amount), 0);
        const prevExp = prevExpenses.reduce((sum, e) => sum + safeNumber(e.amount), 0);

        const currProfit = currRev - currExp;
        const prevProfit = prevRev - prevExp;

        // 4. Global Indicators (Static totals)
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
            saleCount: sales.filter(s => !s.isCancelled).length,
            totalOutstandingDebt: roundFinancial(totalOutstandingDebt),
            totalInventoryValue: roundFinancial(totalInventoryValue),
            averageBasket: sales.length > 0 ? currRev / sales.length : 0,
            profitMargin: currRev > 0 ? (currProfit / currRev) * 100 : 0,
            totalRevenueChange: this.calcTrend(currRev, prevRev),
            netProfitChange: this.calcTrend(currProfit, prevProfit),
            totalExpensesChange: this.calcTrend(currExp, prevExp),
            saleCountChange: this.calcTrend(sales.length, prevSales.length)
        };

        // 5. Optimized Time-Series Aggregation (O(N) using Hash Map)
        const dailyMap = new Map<string, { r: number, p: number }>();
        sales.filter(s => !s.isCancelled).forEach(s => {
            const key = format(safeToDate(s.createdAt!), 'yyyy-MM-dd');
            const entry = dailyMap.get(key) || { r: 0, p: 0 };
            entry.r += safeNumber(s.total);
            entry.p += (safeNumber(s.total) - s.items.reduce((sum, i) => sum + (i.quantity * i.purchasePrice), 0));
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

        // 6. Top Customers Calculation
        const customerMap = new Map<string, { spent: number, count: number }>();
        sales.filter(s => !s.isCancelled && s.customerUuid).forEach(s => {
            const uuid = s.customerUuid!;
            const curr = customerMap.get(uuid) || { spent: 0, count: 0 };
            customerMap.set(uuid, { spent: curr.spent + s.total, count: curr.count + 1 });
        });

        const topCustomers: TopCustomer[] = [];
        const sortedCustomers = Array.from(customerMap.entries())
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

        // 7. Recovery Rate Calculation
        const totalPaymentsReceived = payments.reduce((sum, p) => sum + safeNumber(p.amount), 0);
        const totalCreditSales = sales.filter(s => !s.isCancelled).reduce((sum, s) => sum + (s.total - s.amountPaid), 0);
        const recoveryRate = totalCreditSales > 0 ? (totalPaymentsReceived / totalCreditSales) * 100 : 100;

        // 8. Bread Logic (Today Only)
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const breadOrders = await db.bread_orders.where('date').equals(todayStr).toArray();

        return {
            stats,
            salesByDay,
            topCustomers,
            recoveryRate,
            debtAging,
            recentActivity: [], // Handled by separate feed logic if needed
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
                stockRotation: roundFinancial(currRev / (totalInventoryValue || 1)),
                recoveryRate: roundFinancial(recoveryRate),
                activeCustomers: await db.customers.filter(c => !c.deletedAt).count(),
                activeProducts: await db.products.filter(p => !p.deletedAt).count()
            },
            topProducts: [] // Can be added similar to topCustomers
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