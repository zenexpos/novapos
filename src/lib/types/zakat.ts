export interface ZakatData {
    inventoryValueCost: number;
    inventoryValueSale: number;
    customerDebts: number;
    supplierDebts: number;
    netAssets: number;
    nisabThreshold: number | null;
    goldPrice: number;
    zakatAmount: number;
    zakatDue: boolean;
}
