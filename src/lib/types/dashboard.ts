import { SaleStatus } from './sale';

export interface DashboardStats {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    saleCount: number;
    totalOutstandingDebt: number;
    totalInventoryValue: number;
    averageBasket: number;
    profitMargin: number;
    totalRevenueChange?: number;
    netProfitChange?: number;
    totalExpensesChange?: number;
    saleCountChange?: number;
}

export interface RecentSale {
    uuid: string;
    invoiceNumber: string;
    total: number;
    createdAt: Date;
    paymentStatus: SaleStatus;
    customerName: string;
}

export interface RecentReturn {
    uuid: string;
    originalInvoiceNumber: string;
    totalReturnValue: number;
    createdAt: Date;
    customerName: string;
}

export interface TopProduct {
    productUuid: string;
    name: string;
    quantitySold: number;
    revenueGenerated: number;
    marginTotal: number;
}

export interface TopCustomer {
    customerUuid: string;
    name: string;
    totalSpent: number;
    saleCount: number;
}

export interface LowStockProduct {
    uuid: string;
    name: string;
    quantity: number;
    minStockLevel: number;
    unite?: string;
}

export interface SalesByDay {
    date: string;
    total: number;
    profit: number;
    count: number;
}

export interface DashboardData {
    stats: DashboardStats;
    salesByDay: SalesByDay[];
    recentSales: RecentSale[];
    recentReturns: RecentReturn[];
    topProducts: TopProduct[];
    topCustomers: TopCustomer[];
    lowStockProducts: LowStockProduct[];
}
