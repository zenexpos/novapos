import { Dexie, type EntityTable } from 'dexie';
import type {
    Product, Customer, Sale, Expense, Supplier, SupplierPayment,
    StockIntake, ProductReturn, Payment, BreadOrder, CompanyProfile, InventoryLog,
    ProformaInvoice
} from './types';

class iPOSDatabase extends Dexie {
    products!:          EntityTable<Product,        'id'>;
    customers!:         EntityTable<Customer,       'id'>;
    sales!:             EntityTable<Sale,           'id'>;
    expenses!:          EntityTable<Expense,        'id'>;
    suppliers!:         EntityTable<Supplier,       'id'>;
    supplier_payments!: EntityTable<SupplierPayment,'id'>;
    stock_intakes!:     EntityTable<StockIntake,    'id'>;
    product_returns!:   EntityTable<ProductReturn,  'id'>;
    payments!:          EntityTable<Payment,        'id'>;
    bread_orders!:      EntityTable<BreadOrder,     'id'>;
    company_profile!:   EntityTable<CompanyProfile, 'id'>;
    inventory_logs!:    EntityTable<InventoryLog,   'id'>;
    proforma_invoices!: EntityTable<ProformaInvoice, 'id'>;

    constructor() {
        super('iPOSDatabase');

        // FIX: Version 1 — initial schema (for users on v1, migration path is defined)
        this.version(1).stores({
            products:         '++id, &uuid, name, supplierUuid, stockStatus',
            customers:        '++id, &uuid, searchName, debtStatus',
            sales:            '++id, &uuid, invoiceNumber, customerUuid, paymentStatus',
            expenses:         '++id, &uuid, category, expenseDate',
            suppliers:        '++id, &uuid, &name',
            supplier_payments:'++id, &uuid, supplierUuid, paymentDate',
            stock_intakes:    '++id, &uuid, supplierUuid, createdAt, invoiceNumber',
            product_returns:  '++id, &uuid, originalSaleUuid, customerUuid, createdAt',
            payments:         '++id, &uuid, customerUuid, paymentDate',
            bread_orders:     '++id, &uuid, date, customerUuid',
            company_profile:  '++id, &uuid',
            inventory_logs:   '++id, &uuid, productUuid, relatedUuid, reason, createdAt',
        });

        // FIX: Version 2 — adds proforma_invoices and extra indexes
        this.version(2).stores({
            products:         '++id, &uuid, name, *barcodes, supplierUuid, stockStatus, dateExpiration',
            customers:        '++id, &uuid, searchName, debtStatus, isOverLimit, isBreadClient, outstandingBalance',
            sales:            '++id, &uuid, invoiceNumber, customerUuid, createdAt, paymentStatus',
            expenses:         '++id, &uuid, category, expenseDate',
            suppliers:        '++id, &uuid, &name',
            supplier_payments:'++id, &uuid, supplierUuid, paymentDate',
            stock_intakes:    '++id, &uuid, supplierUuid, createdAt, invoiceNumber',
            product_returns:  '++id, &uuid, originalSaleUuid, customerUuid, createdAt',
            payments:         '++id, &uuid, customerUuid, paymentDate',
            bread_orders:     '++id, &uuid, date, customerUuid, venteUuid',
            company_profile:  '++id, &uuid',
            inventory_logs:   '++id, &uuid, productUuid, relatedUuid, reason, createdAt',
            proforma_invoices:'++id, &uuid, &proformaNumber, customerUuid, createdAt',
        });

        // FIX: Version 3 — adds bread_type_recurrence index + uniqueness on proformaNumber
        // FIX: createdAt indexed on sales (was missing — caused full table scan on date queries)
        // FIX: proformaNumber marked unique (&) to prevent duplicate invoice numbers
        this.version(3).stores({
            products:         '++id, &uuid, name, *barcodes, supplierUuid, stockStatus, dateExpiration',
            customers:        '++id, &uuid, searchName, debtStatus, isOverLimit, isBreadClient, bread_type_recurrence, outstandingBalance',
            sales:            '++id, &uuid, invoiceNumber, customerUuid, createdAt, paymentStatus',
            expenses:         '++id, &uuid, category, expenseDate',
            suppliers:        '++id, &uuid, &name',
            supplier_payments:'++id, &uuid, supplierUuid, paymentDate',
            stock_intakes:    '++id, &uuid, supplierUuid, createdAt, invoiceNumber',
            product_returns:  '++id, &uuid, originalSaleUuid, customerUuid, createdAt',
            payments:         '++id, &uuid, customerUuid, paymentDate',
            bread_orders:     '++id, &uuid, date, customerUuid, venteUuid',
            company_profile:  '++id, &uuid',
            inventory_logs:   '++id, &uuid, productUuid, relatedUuid, reason, createdAt',
            proforma_invoices:'++id, &uuid, &proformaNumber, customerUuid, createdAt',
        });

        // FIX v4: isCancelled indexed on sales — enables efficient soft-delete queries
        // without full table scans. cancelledAt indexed for audit reports by date.
        this.version(4).stores({
            products:         '++id, &uuid, name, *barcodes, supplierUuid, stockStatus, dateExpiration',
            customers:        '++id, &uuid, searchName, debtStatus, isOverLimit, isBreadClient, bread_type_recurrence, outstandingBalance',
            sales:            '++id, &uuid, invoiceNumber, customerUuid, createdAt, paymentStatus, isCancelled, cancelledAt',
            expenses:         '++id, &uuid, category, expenseDate',
            suppliers:        '++id, &uuid, &name',
            supplier_payments:'++id, &uuid, supplierUuid, paymentDate',
            stock_intakes:    '++id, &uuid, supplierUuid, createdAt, invoiceNumber',
            product_returns:  '++id, &uuid, originalSaleUuid, customerUuid, createdAt',
            payments:         '++id, &uuid, customerUuid, paymentDate',
            bread_orders:     '++id, &uuid, date, customerUuid, venteUuid',
            company_profile:  '++id, &uuid',
            inventory_logs:   '++id, &uuid, productUuid, relatedUuid, reason, createdAt',
            proforma_invoices:'++id, &uuid, &proformaNumber, customerUuid, createdAt',
        });
    }
}

// FIX: Single source of truth for schema version — used in backup.service.ts
export const DB_VERSION = 4;

export const db = new iPOSDatabase();

// FIX: Reload the page if another tab upgrades the schema — prevents stale Dexie connection
if (typeof window !== 'undefined') {
    db.on('versionchange', () => {
        console.warn('[iPOS] Nouvelle version de la base détectée — rechargement...');
        window.location.reload();
    });
}

