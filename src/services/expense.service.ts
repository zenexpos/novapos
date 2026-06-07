'use client';

import type { Expense, ExpenseCategory } from '@/lib/types';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { startOfDay, endOfDay } from 'date-fns';
import { safeNumber } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';

const triggerSync = () => {
    if (typeof window !== 'undefined') {
        const state = useAppStore.getState();
        if (state && state.actions) {
            state.actions.triggerSmartSync();
        }
    }
};

class ExpenseService {

    async filter(params: {
        category?: string;
        from?: Date;
        to?: Date;
        query?: string;
    }): Promise<Expense[]> {
        let collection = db.expenses.toCollection();

        if (params.from) {
            collection = db.expenses
                .where('expenseDate')
                .between(startOfDay(params.from), endOfDay(params.to ?? params.from), true, true);
        }

        if (params.category && params.category !== 'all') {
            collection = collection.filter(e => e.category === params.category);
        }

        let expenses = await collection.toArray();

        if (params.query) {
            const q = params.query.toLowerCase();
            expenses = expenses.filter(e =>
                e.description.toLowerCase().includes(q) ||
                e.category.toLowerCase().includes(q)
            );
        }

        return expenses.sort((a, b) =>
            new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
        );
    }

    async getCategories(): Promise<string[]> {
        const expenses = await db.expenses.toArray();
        return Array.from(new Set(expenses.map(e => e.category))).sort();
    }

    /** Statistiques par catégorie */
    async getCategoryStats(from?: Date, to?: Date): Promise<{ category: ExpenseCategory; total: number; count: number }[]> {
        const expenses = await this.filter({ from, to });
        const map = new Map<string, { total: number; count: number }>();
        for (const e of expenses) {
            const cur = map.get(e.category) ?? { total: 0, count: 0 };
            cur.total += safeNumber(e.amount);
            cur.count += 1;
            map.set(e.category, cur);
        }
        return Array.from(map.entries())
            .map(([category, stats]) => ({ category, ...stats }))
            .sort((a, b) => b.total - a.total);
    }

    async addExpense(data: Omit<Expense, 'uuid' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
        const expense: Expense = {
            ...data,
            uuid:      uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const id = await db.expenses.add(expense);
        expense.id = id;
        triggerSync();
        return expense;
    }

    async updateExpense(uuid: string, data: Partial<Expense>): Promise<Expense> {
        const existing = await db.expenses.where('uuid').equals(uuid).first();
        if (!existing?.id) throw new Error('Dépense introuvable');
        await db.expenses.update(existing.id, { ...data, updatedAt: new Date() });
        triggerSync();
        return { ...existing, ...data, updatedAt: new Date() };
    }

    async deleteExpense(uuid: string): Promise<void> {
        const existing = await db.expenses.where('uuid').equals(uuid).first();
        if (!existing?.id) throw new Error('Dépense introuvable');
        await db.expenses.delete(existing.id);
        triggerSync();
    }

    async deleteMultiple(uuids: string[]): Promise<void> {
        await db.expenses.where('uuid').anyOf(uuids).delete();
        triggerSync();
    }

    async getTotal(from?: Date, to?: Date): Promise<number> {
        const expenses = await this.filter({ from, to });
        return expenses.reduce((s, e) => s + safeNumber(e.amount), 0);
    }
}

export const expenseService = new ExpenseService();
