/**
 * iPOS Zen - Schéma de base de données Enterprise.
 * Version 16.0 - Support multi-customer in sales.
 */

export const DB_NAME = 'iPOSDatabase';
export const DB_VERSION = 16;

export const DB_SCHEMA = {
    // Indexation par barcodes pour le scan rapide, et supplierUuid pour le filtrage
    products:           '++id, &uuid, name, *barcodes, supplierUuid, stockStatus, syncStatus, deletedAt',
    // Indexation par searchName pour la recherche CRM rapide
    customers:          '++id, &uuid, searchName, outstandingBalance, debtStatus, syncStatus, deletedAt',
    // Indexation chronologique et par statut pour le journal
    // *customerUuids allows efficient multi-valued lookup in Dexie
    sales:              '++id, &uuid, invoiceNumber, *customerUuids, paymentStatus, createdAt, syncStatus, isCancelled, deletedAt',
    // Indexation par catégorie pour les rapports financiers
    expenses:           '++id, &uuid, category, expenseDate, syncStatus, deletedAt',
    suppliers:          '++id, &uuid, &name, syncStatus, deletedAt',
    payments:           '++id, &uuid, customerUuid, paymentDate, syncStatus, deletedAt',
    // Indexation par date pour la distribution journalière
    bread_orders:       '++id, &uuid, orderNumber, date, customerUuid, paymentStatus, pickupStatus, transferredToCustomerAccount, deletedAt',
    company_profile:    '++id, &uuid, syncStatus',
    // Indexation par produit pour l'historique spécifique
    inventory_logs:     '++id, &uuid, productUuid, relatedUuid, reason, createdAt',
    stock_intakes:      '++id, &uuid, invoiceNumber, supplierUuid, createdAt',
    product_returns:    '++id, &uuid, originalInvoiceNumber, customerUuid, createdAt',
    supplier_payments:  '++id, &uuid, supplierUuid, paymentDate',
    sync_queue:         '++id, table, operation, timestamp',
    proforma_invoices:  '++id, &uuid, proformaNumber, customerUuid, createdAt'
};
