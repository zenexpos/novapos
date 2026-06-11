// ─────────────────────────────────────────────────────────────────────────────
// iPOS Zen v2.9 — Types TypeScript (TITANIUM OFFLINE EDITION)
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentMethod  = 'cash' | 'check' | 'transfer' | 'ccp';
export type ViewMode       = 'grid' | 'list' | 'compact';
export type SyncStatus     = 'synced' | 'pending' | 'failed' | 'idle' | 'syncing' | 'success' | 'error';
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
    stockStatus?:     StockStatus;
    dateMajPrix?:     Date;
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
    debtStatus?:            'none' | 'due_soon' | 'overdue';
    isOverLimit?:           boolean;
    bread_type_recurrence?: 'quotidien' | 'jours_specifiques' | 'aucun';
    bread_quantite_defaut?: number;
    bread_jours_semaine?:   any;
    bread_date_debut?:      string;
}

export interface Supplier extends BaseEntity {
    name:           string;
    contactPerson?: string;
    phone?:         string;
    email?:         string;
    address?:       string;
    balance:        number;
}

export interface Sale extends BaseEntity {
    invoiceNumber:     string;
    items:             SaleItem[];
    subtotal:          number;
    discountType?:     'fixed' | 'percentage';
    discountAmount:    number;
    total:             number;
    amountPaid:        number;
    remainingBalance:  number;
    paymentStatus:     SaleStatus;
    customerUuid?:     string;
    dueDate?:          Date;
    isCancelled?:      boolean;
    cancelledAt?:      Date;
}

export interface SaleItem {
    productUuid:   string | null;
    name:          string;
    price:         number;
    purchasePrice: number;
    quantity:      number;
    tva_rate?:     number;
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

export interface SupplierPayment extends BaseEntity {
    supplierUuid: string;
    amount:       number;
    paymentDate:  Date;
    method:       PaymentMethod;
    notes?:       string;
}

export interface InventoryLog extends BaseEntity {
    productUuid: string | null;
    change:      number;
    newQuantity: number;
    reason:      InventoryLogReason;
    relatedUuid?: string;
    details?: string;
    oldValue?: any;
    newValue?: any;
}

export type InventoryLogReason = 
    | 'sale' 
    | 'return' 
    | 'stock_intake' 
    | 'cancellation' 
    | 'manual_adjustment' 
    | 'create_proforma_from_pos'
    | 'bread_order_status_change'
    | 'bread_order_transfer';

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
    city?:              string;
    zip_code?:          string;
    country?:           string;
    phone?:             string;
    email?:             string;
    website?:           string;
    logo_url?:          string;
    rc_number?:         string;
    nif?:               string;
    ai_number?:         string;
    nis_number?:        string;
    legal_form?:        string;
    tva_rate?:          number;
    is_tva_exempt?:     boolean;
    tva_exempt_reason?: string;
    invoice_prefix?:    string;
    invoice_counter:    number;
    proforma_counter?:  number;
    bread_counter?:     number;
    goldPricePerGram?:  number;
    prix_pain?:         number;
    zakat_use_sale_price?: boolean;
    supabase_url?:      string;
    supabase_key?:      string;
    last_sync_at?:      Date;
}

export interface BreadOrder extends BaseEntity {
    orderNumber:        string;
    customerUuid:       string | null;
    customName?:        string;
    date:               string; // YYYY-MM-DD
    pickupDate:         Date;
    pickupTime?:        string;
    quantity:           number;
    unitPrice:          number;
    totalAmount:        number;
    amountPaid:         number;
    remainingAmount:    number;
    paymentStatus:      'unpaid' | 'partial' | 'paid';
    pickupStatus:       'unreceived' | 'partial' | 'received';
    notes?:             string;
    transferredToCustomerAccount: boolean;
    transferredAt?:     Date | null;
    debtId?:            string | null; // UUID of generated Sale/Debt
    venteUuid:          string | null; // Keep for compatibility
}

export interface BreadOrderWithCustomer extends BreadOrder {
    customer: Customer | null;
}

export interface StockIntake extends BaseEntity {
    supplierUuid?:      string;
    invoiceNumber?:     string;
    invoiceDate?:       Date;
    shippingCost?:      number;
    items:              StockIntakeStoredItem[];
    totalValue:         number;
}

export interface StockIntakeStoredItem {
    productUuid:       string;
    productName:       string;
    quantityReceived:  number;
    quantityDamaged:   number;
    purchasePrice:     number;
    landingCost:       number;
}

export interface StockIntakeItem {
    id:              string;
    productUuid?:    string;
    name:            string;
    barcodes?:       string[];
    quantity:        number;
    quantityDamaged: number;
    purchasePrice:   number;
    price:           number;
    unite:           StockUnit;
    isNew?:          boolean;
}

export interface ProductReturn extends BaseEntity {
    originalSaleUuid:       string;
    originalInvoiceNumber:  string;
    items:                  ReturnItem[];
    totalReturnValue:       number;
    amountRefunded:         number;
    customerUuid?:          string;
    notes?:                 string;
}

export interface ReturnItem {
    productUuid:   string | null;
    productName:   string;
    quantity:      number;
    price:         number;
    purchasePrice: number;
    wasRestocked:  boolean;
}

export interface ZakatData {
    inventoryValueCost: number;
    inventoryValueSale: number;
    customerDebts:      number;
    supplierDebts:      number;
    netAssets:          number;
    nisabThreshold:     number | null;
    goldPrice:          number;
    zakatAmount:        number;
    zakatDue:           boolean;
}

export interface ProformaInvoice extends BaseEntity {
    proformaNumber:     string;
    items:              SaleItem[];
    subtotal:           number;
    total:              number;
    customerUuid?:      string;
    status:             'draft' | 'converted';
}

export interface ImportAnalysis {
    customersToAdd:    Partial<Customer>[];
    customersToUpdate: Partial<Customer>[];
    skippedRows:       any[];
    errorRows:         ImportRow[];
    totalRows:         number;
}

export interface ImportRow {
    rowNumber: number;
    data:      any;
    errors:    string[];
}

export interface ProductImportAnalysis {
    productsToAdd:    Partial<Product>[];
    productsToUpdate: Partial<Product>[];
    skippedRows:       any[];
    errorRows:         any[];
    totalRows:         number;
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

export interface RecentSale {
    uuid:           string;
    invoiceNumber:  string;
    total:          number;
    createdAt:      Date;
    paymentStatus:  SaleStatus;
    customerName:   string;
}

export interface RecentReturn {
    uuid:                  string;
    originalInvoiceNumber: string;
    totalReturnValue:      number;
    createdAt:             Date;
    customerName:          string;
}

export interface DashboardStats {
    totalRevenue:         number;
    totalExpenses:        number;
    netProfit:            number;
    saleCount:            number;
    totalOutstandingDebt: number;
    totalInventoryValue:  number;
    averageBasket:        number;
    profitMargin:         number;
    totalRevenueChange:   number;
    netProfitChange:      number;
    totalExpensesChange:  number;
    saleCountChange:      number;
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

export interface LowStockProduct {
    uuid:          string;
    name:          string;
    quantity:      number;
    minStockLevel: number;
    unite?:        string;
}

export interface DashboardData {
    stats:            DashboardStats;
    salesByDay:       SalesByDay[];
    recentSales:      RecentSale[];
    recentReturns:    RecentReturn[];
    topProducts:      TopProduct[];
    topCustomers:     TopCustomer[];
    lowStockProducts: LowStockProduct[];
}

export interface Cart {
    id:           string;
    name:         string;
    items:        CartItem[];
    customerUuid: string | null;
    discount:     {
        type:  'fixed' | 'percentage';
        value: number;
    };
}

export interface CartItem extends Product {
    cartQuantity: number;
    flash?:       boolean;
}
