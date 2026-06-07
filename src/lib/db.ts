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

        // Version 1 — المخطط الأولي
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

        // Version 2 — إضافة الفواتير الأولية والفهارس المتقدمة
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

        // Version 3 — تحسين فهارس رصيد العميل وتفرد أرقام الفواتير
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

        // Version 4 — إضافة فهارس الحذف الناعم (isCancelled) والمزامنة المتقدمة
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

export const DB_VERSION = 4;
export const db = new iPOSDatabase();

if (typeof window !== 'undefined') {
    db.on('versionchange', () => {
        console.warn('[iPOS] تحديث إصدار قاعدة البيانات — جاري إعادة تحميل التطبيق...');
        window.location.reload();
    });
}
