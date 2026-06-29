'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Database, Copy, Check, Terminal } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const SUPABASE_SQL_SCRIPT = `-- ══════════════════════════════════════════════════════════
-- iPOS Zen — Schéma Cloud Elite (Certifié Production v2.9.5)
-- ══════════════════════════════════════════════════════════

-- 0. PRÉREQUIS : Extension pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. IDENTITÉ DE L'ÉTABLISSEMENT
CREATE TABLE IF NOT EXISTS company_profile (
    uuid                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name          TEXT NOT NULL DEFAULT 'Mon Commerce',
    address               TEXT,
    city                  TEXT,
    zip_code              TEXT,
    country               TEXT DEFAULT 'Algérie',
    phone                 TEXT,
    email                 TEXT,
    rc_number             TEXT,
    nif                   TEXT,
    ai_number             TEXT,
    nis_number            TEXT,
    legal_form            TEXT,
    tva_rate              SMALLINT DEFAULT 19,
    is_tva_exempt         BOOLEAN DEFAULT false,
    invoice_prefix        TEXT DEFAULT 'FAC',
    invoice_counter       BIGINT DEFAULT 1,
    gold_price_per_gram   NUMERIC(15,2) DEFAULT 0,
    bread_price           NUMERIC(15,2) DEFAULT 10,
    zakat_use_sale_price  BOOLEAN DEFAULT true,
    last_sync_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PARTENAIRES (FOURNISSEURS)
CREATE TABLE IF NOT EXISTS suppliers (
    uuid            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL UNIQUE,
    contact_person  TEXT,
    phone           TEXT,
    balance         NUMERIC(15,2) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_suppliers_deleted_at ON suppliers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- 3. FICHIER CLIENTS
CREATE TABLE IF NOT EXISTS customers (
    uuid                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name            TEXT NOT NULL,
    last_name             TEXT NOT NULL,
    phone                 TEXT,
    address               TEXT,
    credit_limit          NUMERIC(15,2) DEFAULT 0,
    outstanding_balance   NUMERIC(15,2) DEFAULT 0,
    is_bread_client       BOOLEAN DEFAULT false,
    bread_profile         JSONB DEFAULT '{}',
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW(),
    deleted_at            TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_customers_outstanding_balance ON customers(outstanding_balance);

-- 4. CATALOGUE PRODUITS
CREATE TABLE IF NOT EXISTS products (
    uuid              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              TEXT NOT NULL,
    price             NUMERIC(15,2) NOT NULL,
    purchase_price    NUMERIC(15,2) NOT NULL DEFAULT 0,
    quantity          NUMERIC(15,3) DEFAULT 0,
    min_stock_level   NUMERIC(15,3) DEFAULT 10,
    barcodes          TEXT[],
    unit              TEXT DEFAULT 'Pièce',
    stock_status      TEXT DEFAULT 'in_stock',
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_barcodes ON products USING GIN (barcodes);

-- 5. GRAND LIVRE DES VENTES
CREATE TABLE IF NOT EXISTS sales (
    uuid              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number    TEXT NOT NULL UNIQUE,
    items             JSONB NOT NULL DEFAULT '[]',
    total             NUMERIC(15,2) NOT NULL,
    amount_paid       NUMERIC(15,2) DEFAULT 0,
    remaining_balance NUMERIC(15,2) DEFAULT 0,
    payment_status    TEXT NOT NULL DEFAULT 'unpaid',
    customer_uuid     UUID REFERENCES customers(uuid) ON DELETE SET NULL,
    is_cancelled      BOOLEAN DEFAULT false,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_number ON sales(invoice_number);

-- 6. LOGISTIQUE DE DISTRIBUTION (BREAD)
CREATE TABLE IF NOT EXISTS bread_orders (
    uuid              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_uuid     UUID REFERENCES customers(uuid) ON DELETE SET NULL,
    custom_name       TEXT,
    date              TEXT NOT NULL,
    quantity          NUMERIC(15,3) NOT NULL,
    is_paid           BOOLEAN DEFAULT false,
    is_delivered      BOOLEAN DEFAULT false,
    sale_uuid         UUID REFERENCES sales(uuid) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bread_orders_date ON bread_orders(date);

-- 7. AUDIT DES STOCKS
CREATE TABLE IF NOT EXISTS inventory_logs (
    uuid              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_uuid      UUID REFERENCES products(uuid) ON DELETE CASCADE,
    change            NUMERIC(15,3) NOT NULL,
    new_quantity      NUMERIC(15,3) NOT NULL,
    reason            TEXT NOT NULL,
    related_uuid      UUID,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_uuid ON inventory_logs(product_uuid);
`;

export function SupabaseSqlDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
            setCopied(true);
            toast.success("Script SQL Elite copié.");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
            <Button 
                type="button"
                variant="outline" 
                size="sm" 
                onClick={() => setIsOpen(true)}
                className="h-10 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all gap-2 px-4"
            >
                <Terminal className="h-4 w-4" />
                Générer SQL Cloud
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-sm rounded-lg bg-card">
                    <DialogHeader className="bg-primary/5 p-4 border-b border-primary/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                                    <Database className="h-6 w-6" />
                                </div>
                                <div>
                                    <Database className="text-lg font-semibold tracking-tight">Initialisation Saphir Elite</Database>
                                    <DialogDescription className="font-medium text-[10px] uppercase text-primary/50">Schéma souverain certifié compatible v2.9.5</DialogDescription>
                                </div>
                            </div>
                            <Button onClick={handleCopy} className="rounded-2xl h-12 px-6 font-semibold text-xs uppercase tracking-wide shadow-xl shadow-sm gap-2 transition-all active:scale-95">
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copied ? 'Copié !' : 'Copier script'}
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-grow p-4 bg-black/40 overflow-hidden">
                        <ScrollArea className="h-full rounded-2xl border border-white/5 bg-black/60 p-6 font-mono text-xs leading-relaxed text-emerald-500/80 custom-scrollbar">
                            <pre className="whitespace-pre-wrap">{SUPABASE_SQL_SCRIPT}</pre>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
