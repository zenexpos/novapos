'use client';

import type { DashboardData, TopCustomer, SalesByDay, RecentSale, RecentReturn } from '@/lib/types';
import { eachDayOfInterval, format, startOfDay, endOfDay } from 'date-fns';
import { db } from '@/lib/db';
import { preciseMultiply, safeNumber } from '@/lib/utils';

/**
 * @fileOverview Service de pilotage analytique iPOS Zen.
 * Effectue des calculs financiers complexes avec déduction des retours et amortissement des coûts.
 * Le moteur de calcul utilise les centimes pour une précision absolue.
 */
class DashboardService {
    async getDashboardData(from: Date, to: Date): Promise<DashboardData> {
        try {
            // Dates normalisées pour l'inclusion totale
            const startDate = startOfDay(from);
            const endDate = endOfDay(to);

            // Calcul de la période de comparaison (précédente)
            const duration = endDate.getTime() - startDate.getTime();
            const prevEndDate = new Date(startDate.getTime() - 1);
            const prevStartDate = new Date(prevEndDate.getTime() - duration);

            // Récupération globale des flux
            const [allSales, allExpenses, allReturns, allCustomers, allProducts] =
                await Promise.all([
                    db.sales.where('createdAt').between(prevStartDate, endDate, true, true).filter(s => !s.isCancelled).toArray(),
                    db.expenses.where('expenseDate').between(prevStartDate, endDate, true, true).toArray(),
                    db.product_returns.where('createdAt').between(prevStartDate, endDate, true, true).toArray(),
                    db.customers.toArray(),
                    db.products.toArray(),
                ]);

            const productPurchaseMap = new Map(allProducts.map(p => [p.uuid, safeNumber(p.purchasePrice)]));
            const customerMap = new Map(allCustomers.map(c => [c.uuid, `${c.firstName} ${c.lastName}`]));

            // Calcul en centimes pour éviter les erreurs décimales
            let currRevCents = 0; let currCogsCents = 0; let currExpCents = 0; let currRetValCents = 0; let currRetCogsCents = 0; let currCount = 0;
            let prevRevCents = 0; let prevCogsCents = 0; let prevExpCents = 0; let prevRetValCents = 0; let prevRetCogsCents = 0; let prevCount = 0;

            const productStatsMap = new Map<string, { quantity: number; revenueCents: number }>();
            const customerSpendingMapCents = new Map<string, number>();
            const dailyMapCents = new Map<string, { totalCents: number; profitCents: number; count: number }>();

            // Préparation du graphe
            eachDayOfInterval({ start: startDate, end: endDate }).forEach(day => {
                dailyMapCents.set(format(day, 'yyyy-MM-dd'), { totalCents: 0, profitCents: 0, count: 0 });
            });

            // 1. Analyse des Ventes
            allSales.forEach(sale => {
                const saleDate = new Date(sale.createdAt!);
                const isCurrent = saleDate >= startDate;
                let saleCOGSCents = 0;

                sale.items.forEach(item => {
                    const qty = safeNumber(item.quantity);
                    const cost = safeNumber(item.purchasePrice) || productPurchaseMap.get(item.productUuid || '') || 0;
                    const lineCOGS = Math.round(preciseMultiply(cost, qty) * 100);
                    saleCOGSCents += lineCOGS;

                    if (isCurrent && item.productUuid) {
                        const ps = productStatsMap.get(item.productUuid) || { quantity: 0, revenueCents: 0 };
                        ps.quantity += qty;
                        ps.revenueCents += Math.round(preciseMultiply(safeNumber(item.price), qty) * 100);
                        productStatsMap.set(item.productUuid, ps);
                    }
                });

                const totalSaleCents = Math.round(safeNumber(sale.total) * 100);

                if (isCurrent) {
                    currRevCents += totalSaleCents;
                    currCogsCents += saleCOGSCents;
                    currCount++;
                    const dayKey = format(saleDate, 'yyyy-MM-dd');
                    const d = dailyMapCents.get(dayKey);
                    if (d) {
                        d.totalCents += totalSaleCents;
                        d.profitCents += (totalSaleCents - saleCOGSCents);
                        d.count += 1;
                    }
                    if (sale.customerUuid) {
                        customerSpendingMapCents.set(sale.customerUuid, (customerSpendingMapCents.get(sale.customerUuid) || 0) + totalSaleCents);
                    }
                } else {
                    prevRevCents += totalSaleCents;
                    prevCogsCents += saleCOGSCents;
                    prevCount++;
                }
            });

            // 2. Analyse des Retours
            allReturns.forEach(ret => {
                const retDate = new Date(ret.createdAt!);
                const isCurrent = retDate >= startDate;
                let retCOGSCents = 0;

                ret.items.forEach(item => {
                    if (item.wasRestocked) {
                        const cost = safeNumber(item.purchasePrice) || productPurchaseMap.get(item.productUuid || '') || 0;
                        retCOGSCents += Math.round(preciseMultiply(cost, item.quantity) * 100);
                    }
                });

                const totalRetCents = Math.round(safeNumber(ret.totalReturnValue) * 100);

                if (isCurrent) {
                    currRetValCents += totalRetCents;
                    currRetCogsCents += retCOGSCents;
                    const dayKey = format(retDate, 'yyyy-MM-dd');
                    const d = dailyMapCents.get(dayKey);
                    if (d) {
                        d.totalCents -= totalRetCents;
                        d.profitCents -= (totalRetCents - retCOGSCents);
                    }
                    if (ret.customerUuid) {
                        customerSpendingMapCents.set(ret.customerUuid, (customerSpendingMapCents.get(ret.customerUuid) || 0) - totalRetCents);
                    }
                } else {
                    prevRetValCents += totalRetCents;
                    prevRetCogsCents += retCOGSCents;
                }
            });

            // 3. Analyse des Charges
            allExpenses.forEach(exp => {
                const valCents = Math.round(safeNumber(exp.amount) * 100);
                if (new Date(exp.expenseDate) >= startDate) currExpCents += valCents;
                else prevExpCents += valCents;
            });

            // 4. Calculs Finaux (Net)
            const netRevenue = (currRevCents - currRetValCents) / 100;
            const prevNetRevenue = (prevRevCents - prevRetValCents) / 100;
            
            const netProfit = (currRevCents - currRetValCents - (currCogsCents - currRetCogsCents) - currExpCents) / 100;
            const prevNetProfit = (prevRevCents - prevRetValCents - (prevCogsCents - prevRetCogsCents) - prevExpCents) / 100;

            const calcChange = (curr: number, prev: number) => {
                if (Math.abs(prev) < 0.1) return curr > 0.1 ? 100 : 0;
                return ((curr - prev) / Math.abs(prev)) * 100;
            };

            return {
                stats: {
                    totalRevenue: netRevenue,
                    totalExpenses: currExpCents / 100,
                    netProfit: netProfit,
                    saleCount: currCount,
                    totalOutstandingDebt: allCustomers.reduce((sum, c) => sum + safeNumber(c.outstandingBalance), 0),
                    totalInventoryValue: allProducts.reduce((sum, p) => sum + preciseMultiply(safeNumber(p.quantity), safeNumber(p.purchasePrice)), 0),
                    averageBasket: currCount > 0 ? netRevenue / currCount : 0,
                    profitMargin: netRevenue > 0.1 ? (netProfit / netRevenue) * 100 : 0,
                    totalRevenueChange: calcChange(netRevenue, prevNetRevenue),
                    netProfitChange: calcChange(netProfit, prevNetProfit),
                    totalExpensesChange: calcChange(currExpCents / 100, prevExpCents / 100),
                    saleCountChange: calcChange(currCount, prevCount),
                },
                salesByDay: Array.from(dailyMapCents.entries()).map(([date, v]) => ({ date, total: v.totalCents / 100, profit: v.profitCents / 100, count: v.count })),
                recentSales: allSales
                    .filter(s => new Date(s.createdAt!) >= startDate)
                    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
                    .slice(0, 5)
                    .map(s => ({
                        uuid: s.uuid,
                        invoiceNumber: s.invoiceNumber,
                        total: safeNumber(s.total),
                        createdAt: s.createdAt,
                        paymentStatus: s.paymentStatus,
                        customerName: s.customerUuid ? (customerMap.get(s.customerUuid) || 'INALT') : 'Client de passage',
                    })),
                recentReturns: allReturns
                    .filter(r => new Date(r.createdAt!) >= startDate)
                    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
                    .slice(0, 5)
                    .map(r => ({
                        uuid: r.uuid,
                        originalInvoiceNumber: r.originalInvoiceNumber,
                        totalReturnValue: safeNumber(r.totalReturnValue),
                        createdAt: r.createdAt,
                        customerName: r.customerUuid ? (customerMap.get(r.customerUuid) || 'INALT') : 'Client de passage',
                    })),

                topProducts: Array.from(productStatsMap.entries())
                    .sort((a, b) => b[1].revenueCents - a[1].revenueCents)
                    .slice(0, 5)
                    .map(([uuid, stats]) => {
                        const p = allProducts.find(prod => prod.uuid === uuid);
                        const marginTotal = stats.quantity > 0
                            ? (stats.revenueCents / 100) - (stats.quantity * (productPurchaseMap.get(uuid) ?? 0))
                            : 0;
                        return {
                            productUuid: uuid,
                            name: p?.name || 'Produit Archivé',
                            quantitySold: stats.quantity,
                            revenueGenerated: stats.revenueCents / 100,
                            marginTotal,
                        };
                    }),
                topCustomers: Array.from(customerSpendingMapCents.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([uuid, spentCents]) => ({
                        customerUuid: uuid,
                        name: customerMap.get(uuid) || 'Client de passage',
                        totalSpent: spentCents / 100,
                        saleCount: allSales.filter(s =>
                            s.customerUuid === uuid &&
                            new Date(s.createdAt!).getTime() >= startDate.getTime()
                        ).length,
                    })),
                lowStockProducts: allProducts
                    .filter(p => { const qty = safeNumber(p.quantity); const min = safeNumber(p.minStockLevel); return qty <= 0 || (min > 0 && qty <= min); })
                    .sort((a, b) => safeNumber(a.quantity) - safeNumber(b.quantity))
                    .slice(0, 5),
            };
        } catch (error) {
            console.error('Audit Analytics Error:', error);
            throw error;
        }
    }
}

export const dashboardService = new DashboardService();
