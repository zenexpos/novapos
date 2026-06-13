'use client';

import { db } from '@/lib/db';
import type { DashboardData, DashboardStats, SalesByDay, BreadSummary, DashboardAlert, RecentActivity, TopProduct, TopCustomer } from '@/lib/types';
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { preciseMultiply, safeNumber, roundFinancial, safeToDate } from '@/lib/utils';

/**
 * iPOS Zen — Moteur d'Intelligence Commerciale.
 * Calcule les indicateurs de performance, les tendances et les alertes en temps réel.
 */
class DashboardService {
    async getDashboardData(from: Date, to: Date): Promise<DashboardData> {
        const start = startOfDay(from);
        const end = endOfDay(to);

        // Période précédente pour le calcul des variations
        const duration = end.getTime() - start.getTime();
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - duration);

        const [
            sales, prevSales,
            expenses, prevExpenses,
            payments,
            returns,
            breadOrders,
            customers,
            products,
            intakes
        ] = await Promise.all([
            db.sales.where('createdAt').between(start, end, true, true).filter(s => !s.isCancelled).toArray(),
            db.sales.where('createdAt').between(prevStart, prevEnd, true, true).filter(s => !s.isCancelled).toArray(),
            db.expenses.where('expenseDate').between(start, end, true, true).toArray(),
            db.expenses.where('expenseDate').between(prevStart, prevEnd, true, true).toArray(),
            db.payments.where('paymentDate').between(start, end, true, true).toArray(),
            db.product_returns.where('createdAt').between(start, end, true, true).toArray(),
            db.bread_orders.where('date').equals(format(new Date(), 'yyyy-MM-dd')).toArray(),
            db.customers.toArray(),
            db.products.toArray(),
            db.stock_intakes.orderBy('createdAt').reverse().limit(10).toArray()
        ]);

        // Calcul des métriques financières
        const calcRev = (sList: any[]) => sList.reduce((sum, s) => sum + safeNumber(s.total), 0);
        const calcProfit = (sList: any[]) => sList.reduce((sum, s) => {
            const cost = s.items.reduce((cAcc: number, item: any) => cAcc + (safeNumber(item.purchasePrice) * safeNumber(item.quantity)), 0);
            return sum + (safeNumber(s.total) - cost);
        }, 0);
        
        const currRev = calcRev(sales);
        const prevRev = calcRev(prevSales);
        const currProfit = calcProfit(sales);
        const prevProfit = calcProfit(prevSales);
        const currExp = expenses.reduce((sum, e) => sum + safeNumber(e.amount), 0);
        const prevExp = prevExpenses.reduce((sum, e) => sum + safeNumber(e.amount), 0);
        
        const currCount = sales.length;
        const prevCount = prevSales.length;

        const calcChange = (curr: number, prev: number) => {
            if (prev <= 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / Math.abs(prev)) * 100;
        };

        const stats: DashboardStats = {
            totalRevenue: roundFinancial(currRev),
            totalExpenses: roundFinancial(currExp),
            netProfit: roundFinancial(currProfit - currExp), // Profit des ventes moins les charges fixes
            saleCount: currCount,
            totalOutstandingDebt: customers.reduce((sum, c) => sum + safeNumber(c.outstandingBalance), 0),
            totalInventoryValue: products.reduce((sum, p) => sum + (safeNumber(p.quantity) * safeNumber(p.purchasePrice)), 0),
            averageBasket: currCount > 0 ? currRev / currCount : 0,
            profitMargin: currRev > 0 ? ((currProfit - currExp) / currRev) * 100 : 0,
            totalRevenueChange: calcChange(currRev, prevRev),
            totalExpensesChange: calcChange(currExp, prevExp),
            netProfitChange: calcChange(currProfit - currExp, prevProfit - prevExp),
            saleCountChange: calcChange(currCount, prevCount)
        };

        // Génération des données pour le graphique (Séquence temporelle)
        const days = eachDayOfInterval({ start, end });
        const salesByDay: SalesByDay[] = days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const daySales = sales.filter(s => format(safeToDate(s.createdAt!), 'yyyy-MM-dd') === dayStr);
            const dayExpenses = expenses.filter(e => format(safeToDate(e.expenseDate), 'yyyy-MM-dd') === dayStr);
            
            const rev = daySales.reduce((sum, s) => sum + safeNumber(s.total), 0);
            const profit = daySales.reduce((sum, s) => {
                const cost = s.items.reduce((cAcc: number, item: any) => cAcc + (safeNumber(item.purchasePrice) * safeNumber(item.quantity)), 0);
                return sum + (safeNumber(s.total) - cost);
            }, 0);
            const exp = dayExpenses.reduce((sum, e) => sum + safeNumber(e.amount), 0);
            
            return {
                date: format(day, 'dd/MM'),
                revenue: roundFinancial(rev),
                profit: roundFinancial(profit - exp),
                expenses: roundFinancial(exp)
            };
        });

        // Résumé Logistique Pain
        const breadSummary: BreadSummary = {
            totalOrders: breadOrders.length,
            totalQuantity: breadOrders.reduce((sum, o) => sum + o.quantity, 0),
            deliveredCount: breadOrders.filter(o => o.isDelivered).length,
            paidCount: breadOrders.filter(o => o.isPaid).length,
            unpaidCount: breadOrders.filter(o => !o.isPaid).length,
            remainingAmount: breadOrders.filter(o => !o.isPaid).reduce((sum, o) => sum + o.totalAmount, 0)
        };

        // Système d'Alertes Stratégiques
        const alerts: DashboardAlert[] = [];
        products.forEach(p => {
            if (p.quantity <= 0) {
                alerts.push({ 
                    id: `out-${p.uuid}`, 
                    type: 'critical', 
                    message: `Rupture critique: ${p.name}`, 
                    description: 'Article épuisé, ventes impossibles.' 
                });
            } else if (p.quantity <= p.minStockLevel) {
                alerts.push({ 
                    id: `low-${p.uuid}`, 
                    type: 'warning', 
                    message: `Stock faible: ${p.name}`, 
                    description: `Il ne reste que ${p.quantity} ${p.unit}.` 
                });
            }
        });

        customers.forEach(c => {
            if (c.isOverLimit) {
                alerts.push({ 
                    id: `debt-${c.uuid}`, 
                    type: 'critical', 
                    message: `Crédit bloqué: ${c.firstName} ${c.lastName}`, 
                    description: `Plafond dépassé (${formatCurrency(c.outstandingBalance)}).` 
                });
            }
        });

        // Top 10 Produits (Contribution à la Marge)
        const productStats = new Map<string, { qty: number, rev: number, cost: number }>();
        sales.forEach(s => s.items.forEach(i => {
            if (!i.productUuid) return;
            const curr = productStats.get(i.productUuid) || { qty: 0, rev: 0, cost: 0 };
            curr.qty += i.quantity;
            curr.rev += (i.price * i.quantity);
            curr.cost += (i.purchasePrice * i.quantity);
            productStats.set(i.productUuid, curr);
        }));

        const topProducts: TopProduct[] = Array.from(productStats.entries())
            .map(([uuid, stat]) => {
                const p = products.find(prod => prod.uuid === uuid);
                return {
                    productUuid: uuid,
                    name: p?.name || 'Article Inconnu',
                    quantitySold: stat.qty,
                    revenueGenerated: stat.rev,
                    marginTotal: stat.rev - stat.cost,
                    marginPercent: stat.rev > 0 ? ((stat.rev - stat.cost) / stat.rev) * 100 : 0
                };
            })
            .sort((a, b) => b.marginTotal - a.marginTotal)
            .slice(0, 10);

        // Top 10 Clients (Volume d'achat)
        const topCustomers: TopCustomer[] = customers
            .filter(c => c.totalSpent > 0)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10)
            .map(c => ({
                customerUuid: c.uuid,
                name: `${c.firstName} ${c.lastName}`,
                totalSpent: c.totalSpent,
                outstandingBalance: c.outstandingBalance,
                lastPurchaseDate: c.lastActivityDate
            }));

        // Activité Récente (Journal chronologique)
        const recentActivity: RecentActivity[] = [
            ...sales.slice(-10).map(s => ({ 
                id: s.uuid, 
                type: 'sale' as const, 
                title: `Vente #${s.invoiceNumber}`, 
                description: s.customerUuid ? 'Client Premium' : 'Passage', 
                timestamp: safeToDate(s.createdAt!), 
                amount: s.total, 
                status: 'success' as const 
            })),
            ...payments.slice(-5).map(p => ({ 
                id: p.uuid, 
                type: 'payment' as const, 
                title: 'Encaissement', 
                description: 'Versement sur dette', 
                timestamp: safeToDate(p.paymentDate), 
                amount: p.amount, 
                status: 'info' as const 
            })),
            ...returns.slice(-5).map(r => ({ 
                id: r.uuid, 
                type: 'return' as const, 
                title: `Retour #${r.originalInvoiceNumber}`, 
                description: 'Marchandise réintégrée', 
                timestamp: safeToDate(r.createdAt!), 
                amount: r.totalReturnValue, 
                status: 'warning' as const 
            })),
            ...intakes.slice(-5).map(i => ({ 
                id: i.uuid, 
                type: 'intake' as const, 
                title: 'Réception Stock', 
                description: i.invoiceNumber || 'Arrivage', 
                timestamp: safeToDate(i.createdAt!), 
                amount: i.totalValue, 
                status: 'info' as const 
            }))
        ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 20);

        return {
            stats,
            salesByDay,
            breadSummary,
            alerts: alerts.sort((a, b) => (a.type === 'critical' ? -1 : 1)).slice(0, 10),
            topProducts,
            topCustomers,
            recentActivity,
            inventoryHealth: {
                outOfStock: products.filter(p => p.quantity <= 0).length,
                lowStock: products.filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel).length,
                healthy: products.filter(p => p.quantity > p.minStockLevel).length,
                totalValue: roundFinancial(products.reduce((sum, p) => sum + (safeNumber(p.quantity) * safeNumber(p.purchasePrice)), 0))
            }
        };
    }
}

export const dashboardService = new DashboardService();
