'use client';

import { db } from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { safeNumber, roundFinancial } from '@/lib/utils';
import type { Sale, Expense, Payment } from '@/lib/types';

/**
 * Service de Clôture Quotidienne (Z-Report).
 * Calcule les revenus réels, les dépenses et les foirages de caisse.
 */
class ClosingService {
    async generateDailyZReport(date: Date = new Date()) {
        const start = startOfDay(date);
        const end = endOfDay(date);

        const [sales, expenses, payments] = await Promise.all([
            db.sales.where('createdAt').between(start, end, true, true).filter(s => !s.isCancelled).toArray(),
            db.expenses.where('expenseDate').between(start, end, true, true).toArray(),
            db.payments.where('paymentDate').between(start, end, true, true).toArray(),
        ]);

        const cashRevenue = sales.reduce((sum, s) => sum + safeNumber(s.amountPaid), 0);
        const debtRecovered = payments.reduce((sum, p) => sum + safeNumber(p.amount), 0);
        const totalCashIn = cashRevenue + debtRecovered;
        const totalExpenses = expenses.reduce((sum, e) => sum + safeNumber(e.amount), 0);

        const expectedCash = totalCashIn - totalExpenses;

        return {
            date: format(date, 'yyyy-MM-dd'),
            summary: {
                cashRevenue: roundFinancial(cashRevenue),
                debtRecovered: roundFinancial(debtRecovered),
                totalExpenses: roundFinancial(totalExpenses),
                expectedCash: roundFinancial(expectedCash),
                saleCount: sales.length,
            },
            isClosed: false
        };
    }

    async closeDay(actualCash: number, notes?: string) {
        const report = await this.generateDailyZReport();
        const variance = actualCash - report.summary.expectedCash;

        // Implementation of permanent record storage can be added to db.z_reports table if needed
        return {
            ...report,
            actualCash,
            variance: roundFinancial(variance),
            closedAt: new Date(),
            notes
        };
    }
}

export const closingService = new ClosingService();

function format(date: Date, arg1: string): string {
    return date.toISOString().split('T')[0];
}
