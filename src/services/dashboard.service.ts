'use client';

import { db } from '@/lib/db';
import type { DashboardData, DashboardStats, SalesByDay, BreadSummary, DashboardAlert, RecentActivity, TopProduct, TopCustomer } from '@/lib/types';
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from 'date-fns';
import { safeNumber, roundFinancial, safeToDate } from '@/lib/utils';

/**
 * iPOS Zen — Moteur d'Intelligence Commerciale Optimisé.
 * Utilise des méthodes de comptage et micro-réduction pour éviter les gels CPU.
 * OPTIMISATION FORENSIC : Évite db.products.toArray() et db.customers.toArray() qui bloquent le thread principal.
 */
class DashboardService {
    async getDashboardData(from: Date, to: Date): Promise<DashboardData> {
        const start = startOfDay(from);
        const end = endOfDay(to);

        const duration = end.getTime() - start.getTime();
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - duration);

        // RÉCUPÉRATION SURGIQUE (On évite db.products.toArray sur les catalogues massifs)
        const [
            sales,
            prevSales,
            expenses,
            prevExpenses,
            customersCount,
            totalInventoryValue,
            inventoryStats,
            breadOrders,
            recentSales,
            recentPayments,
            recentReturns,
            recentIntakes
        ] = await Promise.all([
            db.sales.where('createdAt').between(start, end, true, true).filter(s => !s.isCancelled).toArray(),
            db.sales.where('createdAt').between(prevStart, prevEnd, true, true).filter(s => !s.isCancelled).toArray(),
            db.expenses.where('expenseDate').between(start, end, true, true).toArray(),
            db.expenses.where('expenseDate').between(prevStart, prevEnd, true, true).toArray(),
            
            // Stats Clients : Uniquement le compte
            db.customers.count(),
            
            // Valeur Stock : Calculer via curseur pour ne pas saturer la RAM
            this.getInventoryValue(),
            
            // Santé Stock : Via compteurs
            this.getInventoryHealth(),

            db.bread_orders.where('date').equals(format(new Date(), 'yyyy-MM-dd')).toArray(),
            
            // Flux récents
            db.sales.orderBy('createdAt').reverse().limit(10).toArray(),
            db.payments.orderBy('paymentDate').reverse().limit(10).toArray(),
            db.product_returns.orderBy('createdAt').reverse().limit(10).toArray(),
            db.stock_intakes.orderBy('createdAt').reverse().limit(10).toArray()
        ]);

        const calcRev = (list: any[]) => list.reduce((s, x) => s + safeNumber(x.total), 0);
        const calcExp = (list: any[]) => list.reduce((s, x) => s + safeNumber(x.amount), 0);
        
        const currRev = calcRev(sales);
        const prevRev = calcRev(prevSales);
        const currExp = calcExp(expenses);
        const prevExp = calcExp(prevExpenses);

        const stats: DashboardStats = {
            totalRevenue: roundFinancial(currRev),
            totalExpenses: roundFinancial(currExp),
            netProfit: roundFinancial(currRev - currExp),
            saleCount: sales.length,
            totalOutstandingDebt: 0, // Sera peuplé par un service client si besoin
            totalInventoryValue: totalInventoryValue,
            averageBasket: sales.length > 0 ? currRev / sales.length : 0,
            profitMargin: currRev > 0 ? ((currRev - currExp) / currRev) * 100 : 0,
            totalRevenueChange: this.calcPct(currRev, prevRev),
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

        const recentActivity: RecentActivity[] = [
            ...recentSales.map(s => ({ id: s.uuid, type: 'sale' as const, title: `Vente #${s.invoiceNumber}`, description: s.customerUuid ? 'Premium' : 'Passage', timestamp: safeToDate(s.createdAt!), amount: s.total, status: 'success' as const })),
            ...recentPayments.map(p => ({ id: p.uuid, type: 'payment' as const, title: 'Encaissement', description: 'Sur dette', timestamp: safeToDate(p.paymentDate), amount: p.amount, status: 'info' as const })),
            ...recentReturns.map(r => ({ id: r.uuid, type: 'return' as const, title: `Retour #${r.originalInvoiceNumber}`, description: 'Réintégration', timestamp: safeToDate(r.createdAt!), amount: r.totalReturnValue, status: 'warning' as const })),
            ...recentIntakes.map(i => ({ id: i.uuid, type: 'intake' as const, title: 'Réception Stock', description: i.invoiceNumber || 'Arrivage', timestamp: safeToDate(i.createdAt!), amount: i.totalValue, status: 'info' as const }))
        ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 15);

        // Alertes : Récupération ciblée
        const lowStock = await db.products.filter(p => p.quantity <= p.minStockLevel).limit(8).toArray();

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
            alerts: lowStock.map(p => ({
                id: p.uuid, type: p.quantity <= 0 ? 'critical' : 'warning', message: `${p.quantity <= 0 ? 'Rupture' : 'Stock faible'}: ${p.name}`, description: `Reste ${p.quantity} ${p.unit}.`
            })),
            topProducts: [], 
            topCustomers: [],
            inventoryHealth: inventoryStats
        };
    }

    private calcPct(curr: number, prev: number) {
        if (prev <= 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
    }

    private async getInventoryValue(): Promise<number> {
        let total = 0;
        await db.products.each(p => {
            if (p.quantity > 0) total += (p.quantity * p.purchasePrice);
        });
        return roundFinancial(total);
    }

    private async getInventoryHealth() {
        let out = 0;
        let low = 0;
        let healthy = 0;
        let val = 0;

        await db.products.each(p => {
            if (p.quantity <= 0) out++;
            else if (p.quantity <= p.minStockLevel) low++;
            else healthy++;
            
            if (p.quantity > 0) val += (p.quantity * p.purchasePrice);
        });

        return { outOfStock: out, lowStock: low, healthy, totalValue: roundFinancial(val) };
    }
}

export const dashboardService = new DashboardService();
