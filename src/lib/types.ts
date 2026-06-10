// ─────────────────────────────────────────────────────────────────────────────
// iPOS Zen v2.0 — Types TypeScript complets (OPERATION OMEGA SANITIZED)
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// PRIMITIVES & UNIONS
// ══════════════════════════════════════════════════════════════════════════════

export type PaymentMethod  = 'cash' | 'check' | 'transfer' | 'ccp';
export type ViewMode       = 'grid' | 'list' | 'compact';
export type SortDirection  = 'asc' | 'desc';
export type ThemeMode      = 'light' | 'dark' | 'system';
export type ReceiptFormat  = 'a4' | 'thermal';
export type SyncStatus     = 'idle' | 'syncing' | 'success' | 'error';

export type StockUnit =
    | 'Pièce' | 'Kg' | 'Litre' | 'Boîte'
    | 'Carton' | 'Sachet' | 'Bouteille';

export type StockStatus  = 'in_stock' | 'low_stock' | 'out_of_stock';
export type DebtStatus   = 'none' | 'due_soon' | 'overdue';
export type SaleStatus   = 'paid' | 'partial' | 'unpaid';
export type ReturnStatus = 'pending' | 'processed' | 'cancelled';

export type InventoryLogReason =
    | 'sale' | 'return' | 'stock_intake' | 'cancellation'
    | 'manual_adjustment' | 'create_proforma_from_pos';

export type ExpenseCategory =
    | 'Loyer' | 'Salaires' | 'Fournisseurs' | 'Services Publics'
    | 'Marketing' | 'Maintenance' | 'Autre' | string;

// ══════════════════════════════════════════════════════════════════════════════
// PRODUITS
// ══════════════════════════════════════════════════════════════════════════════

export interface Product {
    id?:              number;
    uuid:             string;
    name:             string;
    price:            number;
    purchasePrice:    number;
    quantity:         number;
    minStockLevel:    number;
    barcodes?:        string[];
    unite?:           StockUnit;
    dateExpiration?:  Date;
    supplierUuid?:    string;
    dateMajPrix?:     Date;
    createdAt?:       Date;
    updatedAt?:       Date;
    stockStatus?:     StockStatus;
    notes?:           string;
    category?:        string;
}

// ══════════════════════════════════════════════════════════════════════════════
// CLIENTS
// ══════════════════════════════════════════════════════════════════════════════

export interface Customer {
    id?:                    number;
    uuid:                   string;
    firstName:              string;
    lastName:               string;
    searchName?:            string;
    phone?:                 string;
    address?:               string;
    settlementDay?:         number;
    creditLimit?:           number;
    initialBalance:         number;
    totalSpent:             number;
    outstandingBalance:     number;
    lastActivityDate?:      Date;
    createdAt?:             Date;
    updatedAt?:             Date;
    debtStatus?:            DebtStatus;
    isOverLimit?:           boolean;
    isBreadClient?:         boolean;
    notes?:                 string;
    bread_type_recurrence?: 'quotidien' | 'jours_specifiques' | 'aucun';
    bread_quantite_defaut?: number;
    bread_jours_semaine?:   Record<string, { actif: boolean; quantite: number }>;
}

// ══════════════════════════════════════════════════════════════════════════════
// VENTES
// ══════════════════════════════════════════════════════════════════════════════

export interface SaleItem {
    productUuid:   string | null;
    name:          string;
    price:         number;
    purchasePrice: number;
    quantity:      number;
    tva_rate?:     number;
}

export interface CartItem {
    uuid:          string;
    name:          string;
    price:         number;
    purchasePrice: number;
    quantity:      number;
    minStockLevel: number;
    barcodes?:     string[];
    unite?:        StockUnit;
    supplierUuid?: string;
    stockStatus?:  StockStatus;
    cartQuantity:  number;
    flash?:        boolean;
    notes?:        string;
}

export interface Cart {
    id:           string;
    name:         string;
    items:        CartItem[];
    customerUuid: string | null;
    discount:     { type: 'fixed' | 'percentage'; value: number };
    notes?:       string;
    createdAt?:   Date;
}

export interface Sale {
    id?:               number;
    uuid:              string;
    invoiceNumber:     string;
    items:             SaleItem[];
    subtotal:          number;
    discountType?:     'percentage' | 'fixed';
    discountAmount?:   number;
    total:             number;
    amountPaid:        number;
    remainingBalance:  number;
    paymentStatus:     SaleStatus;
    paymentMethod?:    PaymentMethod;
    customerUuid?:     string;
    notes?:            string;
    createdAt?:        Date;
    updatedAt?:        Date;
    dueDate?:          Date;
    isCancelled?:      boolean;
    cancelledAt?:      Date;
    cancellationNote?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// PROFORMA
// ══════════════════════════════════════════════════════════════════════════════

export interface ProformaInvoice {
    id?:            number;
    uuid:           string;
    proformaNumber: string;
    items:          SaleItem[];
    subtotal:       number;
    discountType?:  'percentage' | 'fixed';
    discountAmount?: number;
    total:          number;
    customerUuid?:  string;
    status:         'draft' | 'sent' | 'converted';
    notes?:         string;
    validUntil?:    Date;
    createdAt:      Date;
    updatedAt:      Date;
}

// ══════════════════════════════════════════════════════════════════════════════
// PAIEMENTS
// ══════════════════════════════════════════════════════════════════════════════

export interface Payment {
    id?:          number;
    uuid:         string;
    customerUuid: string;
    amount:       number;
    method?:      PaymentMethod;
    paymentDate:  Date;
    notes?:       string;
    createdAt?:   Date;
    updatedAt?:   Date;
}

// ══════════════════════════════════════════════════════════════════════════════
// PROFIL ENTREPRISE
// ══════════════════════════════════════════════════════════════════════════════

export interface CompanyProfile {
    id?:                number;
    uuid:               string;
    companyName:        string;
    address?:           string;
    city?:              string;
    zipCode?:           string;
    country?:           string;
    phone?:             string;
    email?:             string;
    website?:           string;
    logoUrl?:           string;
    goldPricePerGram?:  number;
    prix_pain?:         number;
    zakat_use_sale_price?: boolean;
    updatedAt?:         Date;
    supabase_url?:      string;
    supabase_key?:      string;
    last_sync_at?:      Date;
    rc_number?:         string;
    nif?:               string;
    ai_number?:         string;
    nis_number?:        string;
    tva_number?:        string;
    legal_form?:        string;
    tva_rate?:          number;
    is_tva_exempt?:     boolean;
    tva_exempt_reason?: string;
    invoice_prefix?:    string;
    invoice_counter?:   number;
    proforma_counter?:  number;
    receipt_format?:    ReceiptFormat;
    low_stock_alerts?:  boolean;
    auto_backup?:       boolean;
}

// ══════════════════════════════════════════════════════════════════════════════
// STOCK & MOUVEMENTS
// ══════════════════════════════════════════════════════════════════════════════

export interface StockIntakeItem {
    id:              string;
    productUuid?:    string;
    barcodes:        string[];
    name:            string;
    quantity:        number;
    quantityDamaged: number;
    purchasePrice:   number;
    price:           number;
    isNew:           boolean;
    unite?:          StockUnit;
}

export interface StockIntakeStoredItem {
    productUuid?:      string;
    productName:       string;
    quantityReceived:  number;
    quantityDamaged:   number;
    purchasePrice:     number;
    landingCost:       number;
}

export interface StockIntake {
    id?:           number;
    uuid:          string;
    supplierUuid?: string;
    invoiceNumber: string;
    invoiceDate:   Date;
    shippingCost:  number;
    items:         StockIntakeStoredItem[];
    totalValue:    number;
    notes?:        string;
    createdAt?:    Date;
    updatedAt?:    Date;
}

export interface InventoryLog {
    id?:         number;
    uuid:        string;
    productUuid: string | null;
    change:      number;
    newQuantity: number;
    reason:      InventoryLogReason | string;
    relatedUuid?: string;
    notes?:      string;
    createdAt:   Date;
    updatedAt?:  Date;
}

// ══════════════════════════════════════════════════════════════════════════════
// RETOURS
// ══════════════════════════════════════════════════════════════════════════════

export interface ReturnItem {
    productUuid:   string | null;
    productName:   string;
    quantity:      number;
    price:         number;
    purchasePrice: number;
    wasRestocked:  boolean;
}

export interface ProductReturn {
    id?:                    number;
    uuid:                   string;
    originalSaleUuid?:      string;
    originalInvoiceNumber:  string;
    items:                  ReturnItem[];
    totalReturnValue:       number;
    amountRefunded:         number;
    refundMethod?:          PaymentMethod;
    customerUuid?:          string;
    createdAt?:             Date;
    updatedAt?:             Date;
    notes?:                 string;
}

// ══════════════════════════════════════════════════════════════════════════════
// DÉPENSES
// ══════════════════════════════════════════════════════════════════════════════

export interface Expense {
    id?:          number;
    uuid:         string;
    description:  string;
    category:     ExpenseCategory;
    amount:       number;
    expenseDate:  Date;
    paymentMethod?: PaymentMethod;
    notes?:       string;
    receiptUrl?:  string;
    createdAt?:   Date;
    updatedAt?:   Date;
}

// ══════════════════════════════════════════════════════════════════════════════
// FOURNISSEURS
// ══════════════════════════════════════════════════════════════════════════════

export interface Supplier {
    id?:            number;
    uuid:           string;
    name:           string;
    contactPerson?: string;
    phone?:         string;
    email?:         string;
    address?:       string;
    balance:        number;
    notes?:         string;
    createdAt?:     Date;
    updatedAt?:     Date;
}

export interface SupplierPayment {
    id?:          number;
    uuid:         string;
    supplierUuid: string;
    amount:       number;
    paymentDate:  Date;
    method:       PaymentMethod;
    notes?:       string;
    createdAt?:   Date;
    updatedAt?:   Date;
}

// ══════════════════════════════════════════════════════════════════════════════
// PAIN
// ══════════════════════════════════════════════════════════════════════════════

export interface BreadOrder {
    id?:                number;
    uuid:               string;
    customerUuid:       string | null;
    customName?:        string;
    date:               string;
    quantite:           number;
    quantite_origine?:  number;
    est_paye:           boolean;
    est_livre:          boolean;
    isManual?:          boolean;
    venteUuid:          string | null;
    createdAt?:         Date;
    updatedAt?:         Date;
}

export interface BreadOrderWithCustomer extends BreadOrder {
    customer: Pick<Customer, 'uuid' | 'firstName' | 'lastName'> | null;
}

// ══════════════════════════════════════════════════════════════════════════════
// IMPORT / EXPORT
// ══════════════════════════════════════════════════════════════════════════════

export interface ImportRow {
    rowNumber: number;
    data:      Record<string, string>;
    errors:    string[];
}

export interface ImportAnalysis {
    customersToAdd:    Partial<Customer>[];
    customersToUpdate: Partial<Customer>[];
    skippedRows:       ImportRow[];
    errorRows:         ImportRow[];
    totalRows:         number;
}

export interface ProductImportAnalysis {
    productsToAdd:    Partial<Product>[];
    productsToUpdate: Partial<Product>[];
    skippedRows:      ImportRow[];
    errorRows:        ImportRow[];
    totalRows:        number;
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

export interface RecentSale extends
    Pick<Sale, 'uuid' | 'invoiceNumber' | 'total' | 'createdAt' | 'paymentStatus'> {
    customerName: string;
}

export interface RecentReturn extends
    Pick<ProductReturn, 'uuid' | 'originalInvoiceNumber' | 'totalReturnValue' | 'createdAt'> {
    customerName: string;
}

export interface SalesByDay {
    date:   string;
    total:  number;
    profit: number;
    count:  number;
}

export interface TopProduct {
    productUuid:      string;
    name:             string;
    quantitySold:     number;
    revenueGenerated: number;
    marginTotal:      number;
}

export interface TopCustomer {
    customerUuid: string;
    name:         string;
    totalSpent:   number;
    saleCount:    number;
}

export interface LowStockProduct extends
    Pick<Product, 'uuid' | 'name' | 'quantity' | 'minStockLevel' | 'unite'> {}

export interface DashboardStats {
    totalRevenue:         number;
    totalExpenses:        number;
    netProfit:            number;
    saleCount:            number;
    totalOutstandingDebt: number;
    totalInventoryValue:  number;
    averageBasket:        number;
    profitMargin:         number;
    totalRevenueChange?:  number;
    netProfitChange?:     number;
    totalExpensesChange?: number;
    saleCountChange?:     number;
    returnCount?:         number;
    returnValue?:         number;
}

export interface DashboardData {
    stats:             DashboardStats;
    salesByDay:        SalesByDay[];
    recentSales:       RecentSale[];
    recentReturns:     RecentReturn[];
    topProducts:       TopProduct[];
    topCustomers:      TopCustomer[];
    lowStockProducts:  LowStockProduct[];
}

// ══════════════════════════════════════════════════════════════════════════════
// ZAKAT
// ══════════════════════════════════════════════════════════════════════════════

export interface ZakatData {
    inventoryValueCost:  number;
    inventoryValueSale:  number;
    customerDebts:       number;
    supplierDebts:       number;
    netAssets:           number;
    nisabThreshold:      number | null;
    goldPrice:           number;
    zakatAmount?:        number;
    zakatDue?:           boolean;
}

export interface DatePreset {
    label: string;
    days:  number;
}

export interface Notification {
    id:        string;
    title:     string;
    message:   string;
    type:      'info' | 'success' | 'warning' | 'error';
    read:      boolean;
    createdAt: Date;
}