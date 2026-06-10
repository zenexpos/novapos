import Dexie, { type EntityTable } from 'dexie';
import type {
    Product, Customer, Sale, Expense, Supplier,
    Payment, BreadOrder, CompanyProfile, InventoryMovement,
    SyncQueueItem
} from './types';

class iPOSDatabase extends Dexie {
    products!:          EntityTable<Product,        'id'>;
    customers!:         EntityTable<Customer,       'id'>;
    sales!:             EntityTable<Sale,           'id'>;
    expenses!:          EntityTable<Expense,        'id'>;
    suppliers!:         EntityTable<Supplier,       'id'>;
    payments!:          EntityTable<Payment,        'id'>;
    bread_orders!:      EntityTable<BreadOrder,     'id'>;
    company_profile!:   EntityTable<CompanyProfile, 'id'>;
    inventory_movements!: EntityTable<InventoryMovement, 'id'>;
    sync_queue!:        EntityTable<SyncQueueItem,  'id'>;

    constructor() {
        super('iPOSDatabase');

        // Version 5 — TITANIUM OFFLINE SCHEMA
        this.version(5).stores({
            products:         '++id, &uuid, name, *barcodes, supplierUuid, syncStatus, deletedAt',
            customers:        '++id, &uuid, searchName, syncStatus, deletedAt',
            sales:            '++id, &uuid, invoiceNumber, customerUuid, createdAt, syncStatus, deletedAt',
            expenses:         '++id, &uuid, category, expenseDate, syncStatus, deletedAt',
            suppliers:        '++id, &uuid, &name, syncStatus, deletedAt',
            payments:         '++id, &uuid, customerUuid, paymentDate, syncStatus, deletedAt',
            bread_orders:     '++id, &uuid, date, customerUuid, venteUuid, syncStatus, deletedAt',
            company_profile:  '++id, &uuid, syncStatus',
            inventory_movements: '++id, &uuid, productUuid, relatedUuid, syncStatus',
            sync_queue:       '++id, table, operation, timestamp'
        });
    }
}

export const db = new iPOSDatabase();

if (typeof window !== 'undefined') {
    db.on('versionchange', () => {
        window.location.reload();
    });
}
