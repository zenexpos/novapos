'use client';

import { db } from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';
import { safeNumber, roundFinancial } from '@/lib/utils';

/**
 * ReportsService — Engine for financial analytics and daily closing.
 */
class ReportsService {
  async getDailySummary(date: Date = new Date()) {
    const start = startOfDay(date);
    const end = endOfDay(date);

    const [sales, expenses, returns, payments] = await Promise.all([
      db.sales.where('createdAt').between(start, end, true, true).filter(s => !s.isCancelled).toArray(),
      db.expenses.where('expenseDate').between(start, end, true, true).toArray(),
      db.product_returns.where('createdAt').between(start, end, true, true).toArray(),
      db.payments.where('paymentDate').between(start, end, true, true).toArray(),
    ]);

    const cashRevenue = sales.reduce((sum, s) => sum + safeNumber(s.amountPaid), 0);
    const debtCollections = payments.reduce((sum, p) => sum + safeNumber(p.amount), 0);
    const totalCashIn = cashRevenue + debtCollections;
    const totalExpenses = expenses.reduce((sum, e) => sum + safeNumber(e.amount), 0);
    const totalReturnsPaid = returns.reduce((sum, r) => sum + safeNumber(r.amountRefunded), 0);

    return {
      cashRevenue: roundFinancial(cashRevenue),
      debtCollections: roundFinancial(debtCollections),
      totalCashIn: roundFinancial(totalCashIn),
      totalExpenses: roundFinancial(totalExpenses),
      totalReturnsPaid: roundFinancial(totalReturnsPaid),
      netCashFlow: roundFinancial(totalCashIn - totalExpenses - totalReturnsPaid),
      transactionCount: sales.length,
    };
  }
}

export const reportsService = new ReportsService();
