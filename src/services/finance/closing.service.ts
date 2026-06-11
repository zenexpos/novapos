'use client';

import { db } from '@/lib/db';
import { startOfDay, endOfDay, format } from 'date-fns';
import { safeNumber, roundFinancial } from '@/lib/utils';

/**
 * Service de Clôture de Caisse (Z-Report) Enterprise.
 * Analyse les recettes réelles, les dépenses et le flux de trésorerie net par session.
 */
class ClosingService {
    /**
     * Génère un rapport de clôture pour une date donnée.
     */
    async generateDailyZReport(date: Date = new Date()) {
        const start = startOfDay(date);
        const end = endOfDay(date);

        // Analyse croisée des flux financiers
        const [sales, expenses, payments] = await Promise.all([
            db.sales.where('createdAt').between(start, end, true, true).filter(s => !s.isCancelled).toArray(),
            db.expenses.where('expenseDate').between(start, end, true, true).toArray(),
            db.payments.where('paymentDate').between(start, end, true, true).toArray(),
        ]);

        // Calcul des encaissements réels (Cash In)
        const cashFromSales = sales.reduce((sum, s) => sum + safeNumber(s.amountPaid), 0);
        const cashFromCustomerPayments = payments.reduce((sum, p) => sum + safeNumber(p.amount), 0);
        const totalCashIn = cashFromSales + cashFromCustomerPayments;

        // Calcul des décaissements (Cash Out)
        const totalExpenses = expenses.reduce((sum, e) => sum + safeNumber(e.amount), 0);

        // Trésorerie nette attendue
        const netCashFlow = totalCashIn - totalExpenses;

        return {
            date: format(date, 'yyyy-MM-dd'),
            summary: {
                salesTotal: roundFinancial(sales.reduce((sum, s) => sum + safeNumber(s.total), 0)),
                cashIn: roundFinancial(totalCashIn),
                cashOut: roundFinancial(totalExpenses),
                netFlow: roundFinancial(netCashFlow),
                stats: {
                    saleCount: sales.length,
                    paymentCount: payments.length,
                    expenseCount: expenses.length
                }
            }
        };
    }
}

export const closingService = new ClosingService();
