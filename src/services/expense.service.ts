'use client';

import type { Expense, ExpenseFormData } from '@/lib/types';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { startOfDay, endOfDay } from 'date-fns';
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
        let collection = db.expenses.filter(e => !e.deletedAt);

        if (params.from) {
            collection = collection.filter(e => {
                const date = new Date(e.expenseDate);
                return date >= startOfDay(params.from!) && date <= endOfDay(params.to ?? params.from!);
            });
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

    /**
     * Ajoute une dépense. Injecte les métadonnées de synchronisation.
     */
    async addExpense(data: ExpenseFormData): Promise<Expense> {
        const now = new Date();
        const expense: Expense = {
            ...data,
            uuid:      uuidv4(),
            createdAt: now,
            updatedAt: now,
            syncStatus: 'pending',
            version: 1
        };

        await db.transaction('rw', [db.expenses, db.sync_queue], async () => {
            const id = await db.expenses.add(expense);
            expense.id = id;
            await db.sync_queue.add({ table: 'expenses', operation: 'CREATE', payload: expense, timestamp: Date.now() });
        });

        triggerSync();
        return expense;
    }

    /**
     * Met à jour une dépense. Gère l'incrémentation de version et le statut pending.
     */
    async updateExpense(uuid: string, data: ExpenseFormData): Promise<void> {
        const existing = await db.expenses.where('uuid').equals(uuid).first();
        if (!existing?.id) throw new Error('Dépense introuvable');
        
        const update: Partial<Expense> = { 
            ...data, 
            updatedAt: new Date(), 
            syncStatus: 'pending',
            version: (existing.version || 1) + 1
        };

        await db.transaction('rw', [db.expenses, db.sync_queue], async () => {
            await db.expenses.update(existing.id!, update);
            await db.sync_queue.add({ 
                table: 'expenses', 
                operation: 'UPDATE', 
                payload: { ...existing, ...update }, 
                timestamp: Date.now() 
            });
        });

        triggerSync();
    }

    async deleteExpense(uuid: string): Promise<void> {
        const existing = await db.expenses.where('uuid').equals(uuid).first();
        if (!existing?.id) return;

        const update = { deletedAt: new Date(), updatedAt: new Date(), syncStatus: 'pending' as const };
        await db.transaction('rw', [db.expenses, db.sync_queue], async () => {
            await db.expenses.update(existing.id!, update);
            await db.sync_queue.add({
                table: 'expenses',
                operation: 'DELETE',
                payload: { uuid },
                timestamp: Date.now()
            });
        });

        triggerSync();
    }
}

export const expenseService = new ExpenseService();
