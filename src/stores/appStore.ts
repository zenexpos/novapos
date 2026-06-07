'use client';
import { create } from 'zustand';
import type { SaleItem, CompanyProfile, ReturnItem, StockIntakeItem, ViewMode, SyncStatus } from '@/lib/types';
import { toast } from 'sonner';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

import { companyProfileService } from '@/services/profile.service';
import { returnService }         from '@/services/return.service';
import { inventoryService }      from '@/services/inventory.service';
import { supplierService }       from '@/services/supplier.service';
import { productService }        from '@/services/product.service';
import { customerService }       from '@/services/customer.service';
import { supabaseSyncService }   from '@/services/supabase.service';
import { preciseMultiply, safeNumber, roundFinancial } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AppState {
    companyProfile:          CompanyProfile | null;
    isCompanyProfileLoading: boolean;
    syncStatus:              SyncStatus;
    lastSyncDate:            Date | null;

    productViewMode:   ViewMode;
    stockViewMode:     ViewMode;
    returnsViewMode:   ViewMode;
    customersViewMode: ViewMode;
    expensesViewMode:  ViewMode;
    salesViewMode:     ViewMode;

    // Nouvelle: barre de recherche globale
    globalSearchOpen: boolean;

    actions: AppActions;
}

interface AppActions {
    fetchCompanyProfile:  () => Promise<void>;
    updateCompanyProfile: (profileData: Partial<CompanyProfile>) => Promise<void>;

    performCloudSync:      (mode: 'push' | 'pull') => Promise<void>;
    performBackgroundSync: () => Promise<void>;
    triggerSmartSync:      () => void;

    processReturn: (returnData: {
        originalSaleUuid: string;
        items:            ReturnItem[];
        totalReturnValue: number;
        amountRefunded:   number;
        customerUuid?:    string;
        notes?:           string;
    }) => Promise<boolean>;

    processStockIntake: (intakeData: {
        supplierName:   string;
        supplierUuid?:  string;
        invoiceNumber:  string;
        invoiceDate:    Date;
        items:          StockIntakeItem[];
        totalValue:     number;
        shippingCost:   number;
    }) => Promise<boolean>;

    setProductViewMode:   (mode: ViewMode) => void;
    setStockViewMode:     (mode: ViewMode) => void;
    setReturnsViewMode:   (mode: ViewMode) => void;
    setCustomersViewMode: (mode: ViewMode) => void;
    setExpensesViewMode:  (mode: ViewMode) => void;
    setSalesViewMode:     (mode: ViewMode) => void;
    setGlobalSearchOpen:  (open: boolean) => void;
}

const initialState: Omit<AppState, 'actions'> = {
    companyProfile:          null,
    isCompanyProfileLoading: true,
    syncStatus:              'idle',
    lastSyncDate:            null,
    productViewMode:         'grid',
    stockViewMode:           'grid',
    returnsViewMode:         'grid',
    customersViewMode:       'grid',
    expensesViewMode:        'list',
    salesViewMode:           'grid',
    globalSearchOpen:        false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            ...initialState,

            actions: {
                // ── Profil ──────────────────────────────────────────────────
                fetchCompanyProfile: async () => {
                    set({ isCompanyProfileLoading: true });
                    try {
                        const profile = await companyProfileService.getProfile();
                        set({ companyProfile: profile, isCompanyProfileLoading: false });
                    } catch {
                        set({ isCompanyProfileLoading: false });
                    }
                },

                updateCompanyProfile: async (profileData) => {
                    try {
                        await companyProfileService.upsertProfile(profileData);
                        const updated = await companyProfileService.getProfile();
                        set({ companyProfile: updated });
                    } catch (err: any) {
                        toast.error('Mise à jour du profil échouée', { description: err.message });
                    }
                },

                // ── Sync ────────────────────────────────────────────────────
                performCloudSync: async (mode) => {
                    if (get().syncStatus === 'syncing') return;
                    const profile = get().companyProfile;
                    if (!profile?.supabase_url || !profile?.supabase_key) {
                        toast.error('Supabase non configuré');
                        return;
                    }
                    set({ syncStatus: 'syncing' });
                    try {
                        if (mode === 'pull') {
                            await supabaseSyncService.pull(profile.supabase_url, profile.supabase_key);
                            toast.success('Données téléchargées depuis le cloud');
                        } else {
                            await supabaseSyncService.push(profile.supabase_url, profile.supabase_key);
                            toast.success('Données envoyées vers le cloud');
                        }
                        set({ syncStatus: 'success', lastSyncDate: new Date() });
                        setTimeout(() => set({ syncStatus: 'idle' }), 3000);
                    } catch (err: any) {
                        set({ syncStatus: 'error' });
                        toast.error('Échec de la synchronisation', { description: err.message });
                        setTimeout(() => set({ syncStatus: 'idle' }), 5000);
                    }
                },

                performBackgroundSync: async () => {
                    const profile = get().companyProfile;
                    if (!profile?.supabase_url || !profile?.supabase_key) return;
                    if (get().syncStatus === 'syncing') return;
                    set({ syncStatus: 'syncing' });
                    try {
                        await supabaseSyncService.smartSync(profile.supabase_url, profile.supabase_key);
                        set({ syncStatus: 'success', lastSyncDate: new Date() });
                        setTimeout(() => set({ syncStatus: 'idle' }), 2000);
                    } catch {
                        set({ syncStatus: 'idle' });
                    }
                },

                triggerSmartSync: () => {
                    const profile = get().companyProfile;
                    if (!profile?.supabase_url || !profile?.supabase_key) return;
                    // Debounce: avoid spamming sync on rapid operations
                    if (get().syncStatus === 'syncing') return;
                    setTimeout(() => {
                        get().actions.performBackgroundSync();
                    }, 1500);
                },

                // ── Retours ─────────────────────────────────────────────────
                processReturn: async (returnData) => {
                    try {
                        await returnService.addReturn(returnData);
                        toast.success('Retour enregistré avec succès');
                        get().actions.triggerSmartSync();
                        return true;
                    } catch (err: any) {
                        toast.error('Échec du retour', { description: err.message });
                        return false;
                    }
                },

                // ── Stock Intake ─────────────────────────────────────────────
                processStockIntake: async (intakeData) => {
                    try {
                        const intakeUuid = uuidv4();
                        const shippingCostCents = Math.round(safeNumber(intakeData.shippingCost) * 100);
                        let itemsTotalValueCents = 0;
                        const finalItems: Array<{
                            productUuid: string;
                            productName: string;
                            quantityReceived: number;
                            quantityDamaged: number;
                            purchasePrice: number;
                            landingCost: number;
                        }> = [];

                        await db.transaction('rw', [
                            db.products,
                            db.suppliers,
                            db.stock_intakes,
                            db.inventory_logs,
                        ], async () => {
                            const supplier = await supplierService.findOrCreateSupplier(
                                intakeData.supplierName,
                                intakeData.supplierUuid,
                            );

                            for (const item of intakeData.items) {
                                const qty             = safeNumber(item.quantity);
                                const damaged         = safeNumber(item.quantityDamaged);
                                const netQty          = qty - damaged;
                                const purchasePriceCents = Math.round(safeNumber(item.purchasePrice) * 100);
                                const itemTotalCents  = purchasePriceCents * qty;
                                itemsTotalValueCents += itemTotalCents;

                                const totalQtyCents = qty > 0 ? qty : 1;
                                const shippingPerItemCents = Math.round(shippingCostCents / intakeData.items.length);
                                const landingCost = roundFinancial(
                                    (purchasePriceCents + shippingPerItemCents / totalQtyCents) / 100
                                );

                                let productUuid: string | undefined;

                                if (item.productUuid) {
                                    productUuid = item.productUuid;
                                    await productService.updateProductFromIntake(item.productUuid, {
                                        purchasePrice: safeNumber(item.purchasePrice),
                                        price: safeNumber(item.price) > 0 ? safeNumber(item.price) : undefined,
                                        barcodes: item.barcodes?.length ? item.barcodes : undefined,
                                    });
                                } else if (item.isNew) {
                                    productUuid = uuidv4();
                                    await db.products.add({
                                        uuid:          productUuid,
                                        name:          item.name,
                                        price:         safeNumber(item.price),
                                        purchasePrice: safeNumber(item.purchasePrice),
                                        quantity:      0,
                                        minStockLevel: 0,
                                        barcodes:      item.barcodes || [],
                                        unite:         item.unite,
                                        supplierUuid:  supplier.uuid,
                                        stockStatus:   'out_of_stock',
                                        createdAt:     new Date(),
                                        updatedAt:     new Date(),
                                    });
                                }

                                if (productUuid && netQty > 0) {
                                    await inventoryService.adjustStock(
                                        productUuid, netQty, 'stock_intake', intakeUuid,
                                    );
                                }

                                if (productUuid) {
                                    finalItems.push({
                                        productUuid,
                                        productName:      item.name,
                                        quantityReceived: qty,
                                        quantityDamaged:  damaged,
                                        purchasePrice:    safeNumber(item.purchasePrice),
                                        landingCost,
                                    });
                                }
                            }

                            const finalTotalValue = (itemsTotalValueCents + shippingCostCents) / 100;

                            await db.stock_intakes.add({
                                uuid:          intakeUuid,
                                supplierUuid:  intakeData.supplierUuid,
                                invoiceNumber: intakeData.invoiceNumber,
                                invoiceDate:   intakeData.invoiceDate,
                                shippingCost:  intakeData.shippingCost,
                                items:         finalItems,
                                totalValue:    finalTotalValue,
                                createdAt:     new Date(),
                                updatedAt:     new Date(),
                            });

                            await supplierService.updateSupplierBalance(
                                intakeData.supplierUuid ?? '',
                                (itemsTotalValueCents + shippingCostCents) / 100,
                            );
                        });

                        toast.success('Réception de stock enregistrée');
                        get().actions.triggerSmartSync();
                        return true;
                    } catch (err: any) {
                        console.error('Intake Error:', err);
                        toast.error('Échec de la réception de stock', { description: err.message });
                        return false;
                    }
                },

                // ── View modes ───────────────────────────────────────────────
                setProductViewMode:   mode => set({ productViewMode:   mode }),
                setStockViewMode:     mode => set({ stockViewMode:     mode }),
                setReturnsViewMode:   mode => set({ returnsViewMode:   mode }),
                setCustomersViewMode: mode => set({ customersViewMode: mode }),
                setExpensesViewMode:  mode => set({ expensesViewMode:  mode }),
                setSalesViewMode:     mode => set({ salesViewMode:     mode }),
                setGlobalSearchOpen:  open => set({ globalSearchOpen:  open }),
            },
        }),
        {
            name: 'ipos-app-store',
            storage: createJSONStorage(() => localStorage),
            partialize: state => ({
                productViewMode:   state.productViewMode,
                stockViewMode:     state.stockViewMode,
                returnsViewMode:   state.returnsViewMode,
                customersViewMode: state.customersViewMode,
                expensesViewMode:  state.expensesViewMode,
                salesViewMode:     state.salesViewMode,
            }),
        },
    ),
);

export const useAppActions       = () => useAppStore(s => s.actions);
export const useCompanyProfile   = () => useAppStore(s => s.companyProfile);
export const useSyncStatus       = () => useAppStore(s => s.syncStatus);
export const useLastSyncDate     = () => useAppStore(s => s.lastSyncDate);
export const useGlobalSearchOpen = () => useAppStore(s => s.globalSearchOpen);
