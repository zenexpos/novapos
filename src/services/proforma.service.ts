'use client';

import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import type { ProformaInvoice, Cart, SaleItem } from '@/lib/types';
import { safeNumber, preciseMultiply } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';

/**
 * Service de gestion des factures proforma (Devis) Elite.
 * Système local-first avec synchronisation Supabase et traçabilité auditée.
 */
class ProformaService {
    
    private triggerSync() {
        if (typeof window !== 'undefined') {
            const state = useAppStore.getState();
            if (state && state.actions) {
                state.actions.triggerSmartSync();
            }
        }
    }

    /**
     * Génère un numéro de proforma unique séquentiel.
     */
    private async generateProformaNumber(): Promise<string> {
        const profile = await db.company_profile.toCollection().first();
        const currentCounter = profile?.proformaCounter || 1;
        const prefix = profile?.invoicePrefix || 'PF';
        const number = `${prefix}-${String(currentCounter).padStart(6, '0')}`;

        if (profile?.id) {
            await db.company_profile.update(profile.id, {
                proformaCounter: currentCounter + 1,
                updatedAt: new Date()
            });
        }
        return number;
    }

    /**
     * Crée une proforma à partir du panier actuel.
     * N'affecte pas les stocks réels ni la comptabilité financière.
     */
    async createProformaFromCart(cart: Cart): Promise<ProformaInvoice> {
        if (!cart.items || cart.items.length === 0) {
            throw new Error("Le panier est vide. Impossible de générer un devis.");
        }

        const now = new Date();
        let proformaNumber = '';

        const subtotalCents = cart.items.reduce(
            (acc, item) => acc + Math.round(preciseMultiply(item.price, item.cartQuantity) * 100),
            0,
        );
        
        let discountCents = 0;
        if (cart.discount.type === 'percentage') {
            discountCents = Math.round((subtotalCents * safeNumber(cart.discount.value)) / 100);
        } else {
            discountCents = Math.round(safeNumber(cart.discount.value) * 100);
        }
        
        const totalCents = Math.max(0, subtotalCents - discountCents);

        const items: SaleItem[] = cart.items.map(item => ({
            productUuid: item.uuid.startsWith('custom-') ? null : item.uuid,
            name: item.name,
            price: safeNumber(item.price),
            purchasePrice: safeNumber(item.purchasePrice),
            quantity: safeNumber(item.cartQuantity),
        }));

        const newProforma: ProformaInvoice = {
            uuid: uuidv4(),
            proformaNumber: '', 
            items,
            subtotal: subtotalCents / 100,
            total: totalCents / 100,
            customerUuid: cart.customerUuid || undefined,
            status: 'draft',
            createdAt: now,
            updatedAt: now,
            syncStatus: 'pending',
            version: 1
        };

        await db.transaction('rw', [db.proforma_invoices, db.inventory_logs, db.company_profile], async () => {
            proformaNumber = await this.generateProformaNumber();
            newProforma.proformaNumber = proformaNumber;
            await db.proforma_invoices.add(newProforma);
            
            await db.inventory_logs.add({
                uuid: uuidv4(),
                productUuid: null,
                change: 0,
                newQuantity: 0,
                reason: 'create_proforma_from_pos',
                relatedUuid: newProforma.uuid,
                createdAt: now,
                updatedAt: now,
                syncStatus: 'pending',
                version: 1
            });
        });

        this.triggerSync();
        return newProforma;
    }
}

export const proformaService = new ProformaService();
