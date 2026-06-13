'use client';

import { db } from '@/lib/db';
import type { DashboardData, DashboardStats, SalesByDay, BreadSummary, DashboardAlert, RecentActivity, TopProduct, TopCustomer, DebtAging } from '@/lib/types';
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval, isAfter, differenceInDays } from 'date-fns';
import { safeNumber, roundFinancial, safeToDate } from '@/lib/utils';

class DashboardService {
    async getDashboardData(from: Date, to: Date): Promise<DashboardData> {
        const start = startOfDay(from);
        const end = endOfDay(to);

        const duration = end.getTime() - start.getTime();
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - duration);

        const [
            sales,
            prevSales,
            expenses,
            prevExpenses,
            customers,
            products,
            payments,
            breadOrders,
            recentSales,
            recentPayments,
            recentReturns,
            recentIntakes,
            allExpenses
        ] = await Promise.all([
            db.sales.where('createdAt').between(start, end, true, true).filter(s => !s.isCancelled).toArray(),
            db.sales.where('createdAt').between(prevStart, prevEnd, true, true).filter(s => !s.isCancelled).toArray(),
            db.expenses.where('expenseDate').between(start, end, true, true).toArray(),
            db.expenses.where('expenseDate').between(prevStart, prevEnd, true, true).toArray(),
            db.customers.filter(c => !c.deletedAt).toArray(),
            db.products.filter(p => !p.deletedAt).toArray(),
            db.payments.where('paymentDate').between(start, end, true, true).toArray(),
            db.bread_orders.where('date').equals(format(new Date(), 'yyyy-MM-dd')).toArray(),
            db.sales.orderBy('createdAt').reverse().limit(10).toArray(),
            db.payments.orderBy('paymentDate').reverse().limit(10).toArray(),
            db.product_returns.orderBy('createdAt').reverse().limit(10).toArray(),
            db.stock_intakes.orderBy('createdAt').reverse().limit(10).toArray(),
            db.expenses.orderBy('expenseDate').reverse().limit(10).toArray()
        ]);

        const calcRev = (list: any[]) => list.reduce((s, x) => s + safeNumber(x.total), 0);
        const calcExp = (list: any[]) => list.reduce((s, x) => s + safeNumber(x.amount), 0);
        
        const currRev = calcRev(sales);
        const prevRev = calcRev(prevSales);
        const currExp = calcExp(expenses);
        const prevExp = calcExp(prevExpenses);

        const currProfit = currRev - currExp;
        const prevProfit = prevRev - prevExp;

        const totalOutstandingDebt = customers.reduce((s, c) => s + safeNumber(c.outstandingBalance), 0);
        const totalInventoryValue = products.reduce((s, p) => s + (safeNumber(p.quantity) * safeNumber(p.purchasePrice)), 0);

        const stats: DashboardStats = {
            totalRevenue: roundFinancial(currRev),
            totalExpenses: roundFinancial(currExp),
            netProfit: roundFinancial(currProfit),
            saleCount: sales.length,
            totalOutstandingDebt: roundFinancial(totalOutstandingDebt),
            totalInventoryValue: roundFinancial(totalInventoryValue),
            averageBasket: sales.length > 0 ? currRev / sales.length : 0,
            profitMargin: currRev > 0 ? (currProfit / currRev) * 100 : 0,
            totalRevenueChange: this.calcPct(currRev, prevRev),
            netProfitChange: this.calcPct(currProfit, prevProfit),
            totalExpensesChange: this.calcPct(currExp, prevExp),
            saleCountChange: this.calcPct(sales.length, prevSales.length)
        };

        const days = eachDayOfInterval({ start, end });
        const salesByDay: SalesByDay[] = days.map(d => {
            const dStr = format(d, 'yyyy-MM-dd');
            const daySales = sales.filter(s => format(safeToDate(s.createdAt!), 'yyyy-MM-dd') === dStr);
            const dayExp = expenses.filter(e => format(safeToDate(e.expenseDate), 'yyyy-MM-dd') === dStr);
            const r = calcRev(daySales);
            const ex = calcExp(dayExp);
            return { date: format(d, 'dd/MM'), revenue: r, profit: r - ex, expenses: ex };
        });

        // Recent Activity
        const recentActivity: RecentActivity[] = [
            ...recentSales.map(s => ({ id: s.uuid, type: 'sale' as const, title: `Vente #${s.invoiceNumber}`, description: s.customerUuid ? 'Compte Client' : 'Client passage', timestamp: safeToDate(s.createdAt!), amount: s.total, status: 'success' as const })),
            ...recentPayments.map(p => ({ id: p.uuid, type: 'payment' as const, title: 'Paiement Reçu', description: 'Sur dette client', timestamp: safeToDate(p.paymentDate), amount: p.amount, status: 'info' as const })),
            ...recentReturns.map(r => ({ id: r.uuid, type: 'return' as const, title: `Retour #${r.originalInvoiceNumber}`, description: 'Réintégration stock', timestamp: safeToDate(r.createdAt!), amount: r.totalReturnValue, status: 'warning' as const })),
            ...recentIntakes.map(i => ({ id: i.uuid, type: 'intake' as const, title: 'Réception Stock', description: i.invoiceNumber || 'Arrivage', timestamp: safeToDate(i.createdAt!), amount: i.totalValue, status: 'info' as const })),
            ...allExpenses.map(e => ({ id: e.uuid, type: 'expense' as const, title: `Dépense: ${e.description}`, description: e.category, timestamp: safeToDate(e.expenseDate), amount: e.amount, status: 'error' as const }))
        ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 20);

        // Top Products
        const productStats = new Map<string, { qty: number, rev: number, margin: number, name: string }>();
        sales.forEach(s => {
            s.items.forEach(item => {
                const curr = productStats.get(item.productUuid || item.name) || { qty: 0, rev: 0, margin: 0, name: item.name };
                curr.qty += item.quantity;
                curr.rev += item.quantity * item.price;
                curr.margin += item.quantity * (item.price - item.purchasePrice);
                productStats.set(item.productUuid || item.name, curr);
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

        // Top Customers
        const topCustomers: TopCustomer[] = customers
            .map(c => ({
                customerUuid: c.uuid,
                name: `${c.firstName} ${c.lastName}`,
                totalSpent: c.totalSpent,
                outstandingBalance: c.outstandingBalance,
                lastPurchaseDate: c.lastActivityDate
            }))
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10);

        // Inventory Health
        const outOfStock = products.filter(p => p.quantity <= 0).length;
        const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel).length;
        const healthy = products.filter(p => p.quantity > p.minStockLevel).length;

        // Debt Aging
        const today = new Date();
        const debtAging: DebtAging[] = [
            { label: 'Récent (0-7j)', value: 0, count: 0 },
            { label: 'Relance (8-30j)', value: 0, count: 0 },
            { label: 'Critique (30j+)', value: 0, count: 0 }
        ];

        customers.forEach(c => {
            if (c.outstandingBalance <= 0) return;
            const days = c.lastActivityDate ? differenceInDays(today, safeToDate(c.lastActivityDate)) : 0;
            if (days <= 7) { debtAging[0].value += c.outstandingBalance; debtAging[0].count++; }
            else if (days <= 30) { debtAging[1].value += c.outstandingBalance; debtAging[1].count++; }
            else { debtAging[2].value += c.outstandingBalance; debtAging[2].count++; }
        });

        // Alerts
        const alerts: DashboardAlert[] = [];
        if (outOfStock > 0) alerts.push({ id: 'alert-oos', type: 'critical', message: `${outOfStock} produits en rupture de stock`, description: 'Ventes manquées potentielles.' });
        if (lowStock > 0) alerts.push({ id: 'alert-low', type: 'warning', message: `${lowStock} produits sous le seuil d'alerte`, description: 'Pensez à commander chez vos fournisseurs.' });
        
        const criticalDebtors = customers.filter(c => c.outstandingBalance > (c.creditLimit || 5000)).length;
        if (criticalDebtors > 0) alerts.push({ id: 'alert-debt', type: 'critical', message: `${criticalDebtors} clients ont dépassé leur crédit`, description: 'Actions de recouvrement prioritaires.' });

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
                recoveryRate: roundFinancial((calcRev(payments) / (currRev || 1)) * 100),
                activeCustomers: customers.filter(c => c.totalSpent > 0).length,
                activeProducts: products.filter(p => p.quantity > 0).length
            }
        };
    }

    private calcPct(curr: number, prev: number) {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / Math.abs(prev)) * 100;
    }
}

export const dashboardService = new DashboardService();
