// ─────────────────────────────────────────────────────────────────────────────
// iPOS Zen v2.0 — Types TypeScript (TITANIUM OFFLINE EDITION)
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentMethod  = 'cash' | 'check' | 'transfer' | 'ccp';
export type ViewMode       = 'grid' | 'list' | 'compact';
export type SyncStatus     = 'synced' | 'pending' | 'failed';
export type NetworkStatus  = 'online' | 'offline' | 'degraded';

export type StockUnit = 'Pièce' | 'Kg' | 'Litre' | 'Boîte' | 'Carton' | 'Sachet' | 'Bouteille';
export type StockStatus  = 'in_stock' | 'low_stock' | 'out_of_stock';
export type SaleStatus   = 'paid' | 'partial' | 'unpaid';

// Metadata for Local-First Sync
export interface BaseEntity {
    id?:          number;
    uuid:         string;
    createdAt:    Date;
    updatedAt:    Date;
    deletedAt?:   Date | null;
    syncStatus:   SyncStatus;
    version:      number;
}

export interface Product extends BaseEntity {
    name:             string;
    price:            number;
    purchasePrice:    number;
    quantity:         number;
    minStockLevel:    number;
    barcodes?:        string[];
    unite?:           StockUnit;
    dateExpiration?:  Date;
    supplierUuid?:    string;
    category?:        string;
}

export interface Customer extends BaseEntity {
    firstName:              string;
    lastName:               string;
    searchName:             string;
    phone?:                 string;
    address?:               string;
    settlementDay?:         number;
    creditLimit?:           number;
    initialBalance:         number;
    totalSpent:             number;
    outstandingBalance:     number;
    lastActivityDate?:      Date;
    isBreadClient?:         boolean;
}

export interface Supplier extends BaseEntity {
    name:           string;
    contactPerson?: string;
    phone?:         string;
    balance:        number;
}

export interface Sale extends BaseEntity {
    invoiceNumber:     string;
    items:             SaleItem[];
    subtotal:          number;
    discountAmount:    number;
    total:             number;
    amountPaid:        number;
    remainingBalance:  number;
    paymentStatus:     SaleStatus;
    customerUuid?:     string;
    dueDate?:          Date;
    isCancelled?:      boolean;
}

export interface SaleItem {
    productUuid:   string | null;
    name:          string;
    price:         number;
    purchasePrice: number;
    quantity:      number;
}

export interface Expense extends BaseEntity {
    description:  string;
    category:     string;
    amount:       number;
    expenseDate:  Date;
}

export interface Payment extends BaseEntity {
    customerUuid: string;
    amount:       number;
    paymentDate:  Date;
    notes?:       string;
}

export interface InventoryMovement extends BaseEntity {
    productUuid: string;
    change:      number;
    newQuantity: number;
    reason:      string;
    relatedUuid?: string;
}

export interface SyncQueueItem {
    id?:         number;
    table:       string;
    operation:   'CREATE' | 'UPDATE' | 'DELETE';
    payload:     any;
    timestamp:   number;
}

export interface CompanyProfile extends BaseEntity {
    companyName:        string;
    address?:           string;
    phone?:             string;
    tva_rate?:          number;
    invoice_counter:    number;
    goldPricePerGram?:  number;
    prix_pain?:         number;
    supabase_url?:      string;
    supabase_key?:      string;
}

export interface BreadOrder extends BaseEntity {
    customerUuid:       string | null;
    customName?:        string;
    date:               string;
    quantite:           number;
    est_livre:          boolean;
    venteUuid:          string | null;
}
