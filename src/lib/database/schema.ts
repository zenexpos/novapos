/**
 * @fileOverview iPOS Zen - Titanium Database Schema
 * Defines the Dexie.js stores and indexing strategy for high-performance offline lookup.
 */

export const DB_NAME = 'iPOSDatabase';
export const DB_VERSION = 6;

export const DB_SCHEMA = {
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
};
