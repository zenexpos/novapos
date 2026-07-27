'use client';

import { create } from 'zustand';
import type { CompanyProfile, ReturnItem, StockIntakeItem, StockIntakeStoredItem, ViewMode, SyncStatus, NetworkStatus } from '@/lib/types';
import { toast } from 'sonner';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

import { companyProfileService } from '@/services/profile.service';
import { returnService }         from '@/services/return.service';
import { inventoryService }      from '@/services/inventory.service';
import { supplierService }       from '@/services/supplier.service';
import { productService }        from '@/services/product.service';
import { supabaseSyncService }   from '@/services/supabase.service';
import { safeNumber, roundFinancial, calculateStockStatus } from '@/lib/utils';

let _syncTimer: NodeJS.Timeout | null = null;

interface AppState {
    companyProfile:          CompanyProfile | null;
    isCompanyProfileLoading: boolean;
    syncStatus:              SyncStatus;
    networkStatus:           NetworkStatus;
    lastSyncDate:            Date | null;

    productViewMode:   ViewMode;
    stockViewMode:     ViewMode;
    returnsViewMode:   ViewMode;
    customersViewMode: ViewMode;
    expensesViewMode:  ViewMode;
    salesViewMode:     ViewMode;
    breadViewMode:     ViewMode;

    actions: AppActions;
}

interface AppActions {
    fetchCompanyProfile:  () => Promise<void>;
    updateCompanyProfile: (profileData: Partial<CompanyProfile>) => Promise<void>;
    setNetworkStatus:     (status: NetworkStatus) => void;

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
    setBreadViewMode:     (mode: ViewMode) => void;
}

const initialState: Omit<AppState, 'actions'> = {
    companyProfile:          null,
    isCompanyProfileLoading: true,
    syncStatus:              'idle',
    networkStatus:           'online',
    lastSyncDate:            null,
    productViewMode:         'grid',
    stockViewMode:           'grid',
    returnsViewMode:         'grid',
    customersViewMode:       'grid',
    expensesViewMode:        'list',
    salesViewMode:           'grid',
    breadViewMode:           'grid',
};

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            ...initialState,

            actions: {
                fetchCompanyProfile: async () => {
                    try {
                        const profile = await companyProfileService.getProfile();
                        set({ companyProfile: profile, isCompanyProfileLoading: false });
                    } catch {
                        set({ isCompanyProfileLoading: false });
                    }
                },

                updateCompanyProfile: async (profileData) => {
                    try {
                        await companyProfileService.upsertProfile({ ...profileData, syncStatus: 'pending' });
                        const updated = await companyProfileService.getProfile();
                        set({ companyProfile: updated });
                        get().actions.triggerSmartSync();
                    } catch (err: any) {
                        toast.error('Erreur profil', { description: err.message });
                    }
                },

                setNetworkStatus: (status) => set({ networkStatus: status }),

                performCloudSync: async (mode) => {
                    const profile = get().companyProfile;
                    if (!profile?.supabaseUrl || !profile?.supabaseKey) {
                        toast.error('Cloud non configuré');
                        return;
                    }

                    set({ syncStatus: 'syncing' });
                    try {
                        if (mode === 'pull') {
                            await supabaseSyncService.pull(profile.supabaseUrl, profile.supabaseKey);
                            toast.success('Données récupérées');
                        } else {
                            await supabaseSyncService.push(profile.supabaseUrl, profile.supabaseKey);
                            toast.success('Données sauvegardées');
                        }
                        set({ syncStatus: 'success', lastSyncDate: new Date() });
                        setTimeout(() => {
                            set({ syncStatus: 'idle' });
                        }, 3000);
                    } catch (err: any) {
                        set({ syncStatus: 'error' });
                        toast.error('Échec sync', { description: err.message });
                    }
                },

                performBackgroundSync: async () => {
                    const profile = get().companyProfile;
                    if (!profile?.supabaseUrl || !profile?.supabaseKey || get().syncStatus === 'syncing') return;

                    set({ syncStatus: 'syncing' });
                    try {
                        await supabaseSyncService.smartSync(profile.supabaseUrl, profile.supabaseKey);
                        set({ syncStatus: 'success', lastSyncDate: new Date() });
                        setTimeout(() => {
                            set({ syncStatus: 'idle' });
                        }, 2000);
                    } catch {
                        set({ syncStatus: 'idle' });
                    }
                },

                triggerSmartSync: () => {
                    if (_syncTimer) clearTimeout(_syncTimer);
                    _syncTimer = setTimeout(() => {
                        get().actions.performBackgroundSync();
                        _syncTimer = null;
                    }, 8000);
                },

                processReturn: async (returnData) => {
                    try {
                        await returnService.addReturn(returnData);
                        get().actions.triggerSmartSync();
                        return true;
                    } catch (err: any) {
                        toast.error('Erreur retour', { description: err.message });
                        return false;
                    }
                },

                processStockIntake: async (intakeData) => {
                    try {
                        const intakeUuid = uuidv4();
                        const shippingCents = Math.round(safeNumber(intakeData.shippingCost) * 100);
                        let itemsTotalPurchaseCents = 0;
                        const finalItems: StockIntakeStoredItem[] = [];

                        // 1. Calcul du total des achats (en centimes pour éviter les erreurs de virgule)
                        intakeData.items.forEach(item => {
                            const qty = safeNumber(item.quantity);
                            const pPriceCents = Math.round(safeNumber(item.purchasePrice) * 100);
                            itemsTotalPurchaseCents += (pPriceCents * qty);
                        });

                        // Facteur de distribution des frais de port proportionnellement à la valeur de chaque produit
                        const shippingFactor = itemsTotalPurchaseCents > 0 ? shippingCents / itemsTotalPurchaseCents : 0;

                        await db.transaction('rw', [
                            db.products, db.suppliers, db.stock_intakes, 
                            db.inventory_logs, db.supplier_payments, db.sync_queue,
                            db.company_profile
                        ], async () => {
                            // Recherche ou création du fournisseur
                            const supplier = await supplierService.findOrCreateSupplier(intakeData.supplierName, intakeData.supplierUuid);

                            for (const item of intakeData.items) {
                                const qty = safeNumber(item.quantity);
                                const pPriceCents = Math.round(safeNumber(item.purchasePrice) * 100);
                                
                                // Calcul du coût de revient réel (prix d'achat + part du transport)
                                const landing = roundFinancial((pPriceCents * (1 + shippingFactor)) / 100);

                                let productUuid = item.productUuid;
                                
                                if (item.productUuid) {
                                    // Mise à jour des prix du produit actuel dans la base
                                    await productService.updateProductFromIntake(item.productUuid, { 
                                        purchasePrice: safeNumber(item.purchasePrice), 
                                        price: safeNumber(item.price) > 0 ? safeNumber(item.price) : undefined 
                                    });
                                } else if (item.isNew) {
                                    // Création automatique d'un nouveau produit s'il n'existe pas
                                    productUuid = uuidv4();
                                    await db.products.add({ 
                                        uuid: productUuid, 
                                        name: item.name, 
                                        price: roundFinancial(safeNumber(item.price)), 
                                        purchasePrice: roundFinancial(safeNumber(item.purchasePrice)), 
                                        quantity: 0, // Sera ajusté immédiatement via le log d'inventaire ci-dessous
                                        minStockLevel: 0, 
                                        barcodes: item.barcodes || [], 
                                        unit: (item.unit as any) || 'Pièce', 
                                        supplierUuid: supplier.uuid, 
                                        stockStatus: 'out_of_stock', 
                                        createdAt: new Date(), 
                                        updatedAt: new Date(), 
                                        syncStatus: 'pending', 
                                        version: 1,
                                        totalSold: 0,
                                        totalRevenue: 0
                                    });
                                }
                                
                                // Ajustement du stock avec enregistrement du mouvement (Piste d'audit)
                                if (productUuid && qty > 0) {
                                    await inventoryService.adjustStock(productUuid, qty, 'stock_intake', intakeUuid);
                                }
                                
                                if (productUuid) {
                                    finalItems.push({ 
                                        productUuid, 
                                        productName: item.name, 
                                        quantityReceived: qty, 
                                        quantityDamaged: safeNumber(item.quantityDamaged), 
                                        purchasePrice: safeNumber(item.purchasePrice), 
                                        landingCost: landing 
                                    });
                                }
                            }

                            // Sauvegarde du bon de réception dans la base
                            const total = roundFinancial((itemsTotalPurchaseCents + shippingCents) / 100);
                            const newIntake = { 
                                uuid: intakeUuid, 
                                supplierUuid: supplier.uuid, 
                                invoiceNumber: intakeData.invoiceNumber, 
                                invoiceDate: intakeData.invoiceDate, 
                                shippingCost: intakeData.shippingCost, 
                                items: finalItems, 
                                totalValue: total, 
                                createdAt: new Date(), 
                                updatedAt: new Date(), 
                                syncStatus: 'pending' as const, 
                                version: 1 
                            };
                            
                            await db.stock_intakes.add(newIntake);
                            
                            // Mise à jour du solde dû au fournisseur (Audit)
                            await supplierService.recalculateSupplierBalance(supplier.uuid);
                            
                            // Enregistrement de l'opération dans la file de synchronisation cloud
                            await db.sync_queue.add({ 
                                table: 'stock_intakes', 
                                operation: 'CREATE', 
                                payload: newIntake, 
                                timestamp: Date.now()
                            });
                        });
                        
                        get().actions.triggerSmartSync();
                        return true;
                    } catch (err: any) {
                        console.error('[iPOS Stock Engine] Intake Failure:', err);
                        toast.error('Échec du traitement de la réception', { description: err.message });
                        return false;
                    }
                },

                setProductViewMode:   m => set({ productViewMode:   m }),
                setStockViewMode:     m => set({ stockViewMode:     m }),
                setReturnsViewMode:   m => set({ returnsViewMode:   m }),
                setCustomersViewMode: m => set({ customersViewMode: m }),
                setExpensesViewMode:  m => set({ expensesViewMode:  m }),
                setSalesViewMode:     m => set({ salesViewMode:     m }),
                setBreadViewMode:     m => set({ breadViewMode:     m }),
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
                breadViewMode:     state.breadViewMode,
            }),
        },
    ),
);

export const useAppActions = () => useAppStore(state => state.actions);
