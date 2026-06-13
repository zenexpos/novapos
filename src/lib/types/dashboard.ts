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

export interface RecentActivity {
    id: string;
    type: 'sale' | 'return' | 'payment' | 'product' | 'customer' | 'expense' | 'intake';
    title: string;
    description: string;
    timestamp: Date;
    amount?: number;
    status?: 'success' | 'warning' | 'info';
}

export interface BreadSummary {
    totalOrders: number;
    totalQuantity: number;
    deliveredCount: number;
    paidCount: number;
    unpaidCount: number;
    remainingAmount: number;
}

export interface DashboardAlert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    message: string;
    description?: string;
    icon?: string;
}

export interface TopProduct {
    productUuid: string;
    name: string;
    quantitySold: number;
    revenueGenerated: number;
    marginTotal: number;
    marginPercent: number;
}

export interface TopCustomer {
    customerUuid: string;
    name: string;
    totalSpent: number;
    outstandingBalance: number;
    lastPurchaseDate?: Date;
}

export interface LowStockProduct {
    uuid: string;
    name: string;
    quantity: number;
    minStockLevel: number;
    unit?: string;
}

export interface SalesByDay {
    date: string;
    revenue: number;
    profit: number;
    expenses: number;
}

export interface DashboardData {
    stats: DashboardStats;
    salesByDay: SalesByDay[];
    breadSummary: BreadSummary;
    alerts: DashboardAlert[];
    topProducts: TopProduct[];
    topCustomers: TopCustomer[];
    recentActivity: RecentActivity[];
    inventoryHealth: {
        outOfStock: number;
        lowStock: number;
        healthy: number;
        totalValue: number;
    };
}
