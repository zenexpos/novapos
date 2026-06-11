import Dexie, { type EntityTable } from 'dexie';
import { DB_NAME, DB_VERSION, DB_SCHEMA } from './schema';
import type {
    Product, Customer, Sale, Expense, Supplier,
    Payment, BreadOrder, CompanyProfile, InventoryLog,
    SyncQueueItem, StockIntake, ProductReturn, SupplierPayment,
    ProformaInvoice
} from '../types';

/**
 * iPOS Zen - Core Database Instance
 * Production-ready IndexedDB engine powered by Dexie.
 */
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
        super(DB_NAME);
        this.version(DB_VERSION).stores(DB_SCHEMA);
    }
}

export const db = new iPOSDatabase();

if (typeof window !== 'undefined') {
    db.on('versionchange', () => {
        console.warn('[iPOS Zen] Database version change detected. Reloading...');
        window.location.reload();
    });
}
