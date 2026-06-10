import Dexie, { type EntityTable } from 'dexie';
import type {
    Product, Customer, Sale, Expense, Supplier,
    Payment, BreadOrder, CompanyProfile, InventoryLog,
    SyncQueueItem, StockIntake, ProductReturn, SupplierPayment,
    ProformaInvoice
} from './types';

/**
 * @fileOverview iPOS Zen Titanium Database.
 * Local-First IndexedDB architecture powered by Dexie.
 * Soft Deletes & Sync Status implemented for absolute sovereignty.
 */

export const DB_VERSION = 6;

class iPOSDatabase extends Dexie {
    products!:           EntityTable<Product,        'id'>;
    customers!:          EntityTable<Customer,       'id'>;
    sales!:              EntityTable<Sale,           'id'>;
    expenses!:           EntityTable<Expense,        'id'>;
    suppliers!:          EntityTable<Supplier,       'id'>;
    payments!:           EntityTable<Payment,        'id'>;
    bread_orders!:       EntityTable<BreadOrder,     'id'>;
    company_profile!:    EntityTable<CompanyProfile, 'id'>;
    inventory_logs!:     EntityTable<InventoryLog,   'id'>;
    sync_queue!:         EntityTable<SyncQueueItem,  'id'>;
    stock_intakes!:      EntityTable<StockIntake,    'id'>;
    product_returns!:    EntityTable<ProductReturn,  'id'>;
    supplier_payments!:  EntityTable<SupplierPayment, 'id'>;
    proforma_invoices!:  EntityTable<ProformaInvoice, 'id'>;

    constructor() {
        super('iPOSDatabase');

        // VERSION 6 — TITANIUM OFFLINE SCHEMA
        // All tables indexed by UUID for conflict-free multi-device sync
        this.version(DB_VERSION).stores({
            products:           '++id, &uuid, name, *barcodes, supplierUuid, syncStatus, deletedAt, dateExpiration',
            customers:          '++id, &uuid, searchName, syncStatus, deletedAt',
            sales:              '++id, &uuid, invoiceNumber, customerUuid, createdAt, syncStatus, deletedAt',
            expenses:           '++id, &uuid, category, expenseDate, syncStatus, deletedAt',
            suppliers:          '++id, &uuid, &name, syncStatus, deletedAt',
            payments:           '++id, &uuid, customerUuid, paymentDate, syncStatus, deletedAt',
            bread_orders:       '++id, &uuid, orderNumber, date, customerUuid, paymentStatus, pickupStatus, transferredToCustomerAccount, deletedAt',
            company_profile:    '++id, &uuid, syncStatus',
            inventory_logs:     '++id, &uuid, productUuid, relatedUuid, reason, createdAt',
            stock_intakes:      '++id, &uuid, invoiceNumber, supplierUuid, createdAt',
            product_returns:    '++id, &uuid, originalInvoiceNumber, customerUuid, createdAt',
            supplier_payments:  '++id, &uuid, supplierUuid, paymentDate',
            proforma_invoices:  '++id, &uuid, proformaNumber, customerUuid, createdAt',
            sync_queue:         '++id, table, operation, timestamp'
        });
    }
}

export const db = new iPOSDatabase();

if (typeof window !== 'undefined') {
    db.on('versionchange', () => {
        console.log('[iPOS Zen] Database version change detected. Refreshing...');
        window.location.reload();
    });
}
