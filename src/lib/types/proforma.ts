import { BaseEntity } from './common';
import { SaleItem } from './sale';

export interface ProformaInvoice extends BaseEntity {
    proformaNumber: string;
    items: SaleItem[];
    subtotal: number;
    total: number;
    customerUuid?: string;
    status: 'draft' | 'sent' | 'converted';
}
