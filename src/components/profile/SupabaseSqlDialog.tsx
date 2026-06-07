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
-- iPOS Zen — Schéma Cloud Elite (Certifié v2.0.1)
-- ══════════════════════════════════════════════════════════
-- Ce script initialise votre coffre-fort Cloud avec une précision
-- absolue conforme aux standards de l'application.

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
    website               TEXT,
    logo_url              TEXT,
    -- Champs administratifs & fiscaux
    rc_number             TEXT,   -- Registre de Commerce
    nif                   TEXT,   -- Numéro d'Identification Fiscale
    ai_number             TEXT,   -- Article d'Imposition
    nis_number            TEXT,   -- Numéro Statistique
    legal_form            TEXT,   -- Forme juridique
    tva_rate              SMALLINT DEFAULT 19 CHECK (tva_rate IN (0, 9, 19)),
    is_tva_exempt         BOOLEAN DEFAULT false,
    tva_exempt_reason     TEXT,
    -- Numérotation & Séquences
    invoice_prefix        TEXT DEFAULT 'FAC',
    invoice_counter       BIGINT DEFAULT 1,
    -- Configuration & Sync
    gold_price_per_gram   NUMERIC(15,2) DEFAULT 0,
    prix_pain             NUMERIC(15,2) DEFAULT 0,
    supabase_url          TEXT,
    supabase_key          TEXT,
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
    email           TEXT,
    address         TEXT,
    balance         NUMERIC(15,2) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FICHIER CLIENTS (CRM & CRÉDIT)
CREATE TABLE IF NOT EXISTS customers (
    uuid                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name            TEXT NOT NULL,
    last_name             TEXT NOT NULL,
    search_name           TEXT,
    phone                 TEXT,
    address               TEXT,
    settlement_day        SMALLINT CHECK (settlement_day BETWEEN 1 AND 31),
    credit_limit          NUMERIC(15,2) DEFAULT 0,
    initial_balance       NUMERIC(15,2) DEFAULT 0,
    total_spent           NUMERIC(15,2) DEFAULT 0,
    outstanding_balance   NUMERIC(15,2) DEFAULT 0,
    last_activity_date    TIMESTAMPTZ,
    debt_status           TEXT DEFAULT 'none' CHECK (debt_status IN ('none','due_soon','overdue')),
    is_over_limit         BOOLEAN DEFAULT false,
    -- Module Logistique Elite
    is_bread_client       BOOLEAN DEFAULT false,
    bread_type_recurrence TEXT CHECK (bread_type_recurrence IN ('quotidien','jours_specifiques','aucun')),
    bread_quantite_defaut NUMERIC(15,3) DEFAULT 0,
    bread_jours_semaine   JSONB DEFAULT '{}',
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CATALOGUE PRODUITS
CREATE TABLE IF NOT EXISTS products (
    uuid              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              TEXT NOT NULL,
    price             NUMERIC(15,2) NOT NULL,
    purchase_price    NUMERIC(15,2) NOT NULL DEFAULT 0,
    quantity          NUMERIC(15,3) DEFAULT 0,
    min_stock_level   NUMERIC(15,3) DEFAULT 10,
    barcodes          TEXT[],
    unite             TEXT DEFAULT 'Pièce',
    date_expiration   TIMESTAMPTZ,
    supplier_uuid     UUID REFERENCES suppliers(uuid) ON DELETE SET NULL,
    date_maj_prix     TIMESTAMPTZ DEFAULT NOW(),
    stock_status      TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock','low_stock','out_of_stock')),
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 5. GRAND LIVRE DES VENTES
CREATE TABLE IF NOT EXISTS sales (
    uuid              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number    TEXT NOT NULL UNIQUE,
    items             JSONB NOT NULL DEFAULT '[]',
    subtotal          NUMERIC(15,2) NOT NULL,
    discount_type     TEXT CHECK (discount_type IN ('fixed','percentage')),
    discount_amount   NUMERIC(15,2) DEFAULT 0,
    total             NUMERIC(15,2) NOT NULL,
    amount_paid       NUMERIC(15,2) DEFAULT 0,
    remaining_balance NUMERIC(15,2) DEFAULT 0,
    payment_status    TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid','partial','unpaid')),
    customer_uuid     UUID REFERENCES customers(uuid) ON DELETE SET NULL,
    due_date          TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 6. REGISTRE DES CHARGES (DÉPENSES)
CREATE TABLE IF NOT EXISTS expenses (
    uuid          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description   TEXT NOT NULL,
    category      TEXT,
    amount        NUMERIC(15,2) NOT NULL,
    expense_date  TIMESTAMPTZ NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MANIFESTES DE RÉCEPTION (STOCKS)
CREATE TABLE IF NOT EXISTS stock_intakes (
    uuid              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_uuid     UUID REFERENCES suppliers(uuid) ON DELETE SET NULL,
    invoice_number    TEXT,
    invoice_date      TIMESTAMPTZ,
    shipping_cost     NUMERIC(15,2) DEFAULT 0,
    items             JSONB NOT NULL DEFAULT '[]',
    total_value       NUMERIC(15,2) NOT NULL,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 8. RETOURS MARCHANDISES
CREATE TABLE IF NOT EXISTS product_returns (
    uuid                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_sale_uuid      UUID REFERENCES sales(uuid) ON DELETE SET NULL,
    original_invoice_number TEXT NOT NULL,
    items                   JSONB NOT NULL DEFAULT '[]',
    total_return_value      NUMERIC(15,2) NOT NULL,
    amount_refunded         NUMERIC(15,2) DEFAULT 0,
    customer_uuid           UUID REFERENCES customers(uuid) ON DELETE SET NULL,
    notes                   TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 9. JOURNAL DES ENCAISSEMENTS CLIENTS
CREATE TABLE IF NOT EXISTS payments (
    uuid          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_uuid UUID NOT NULL REFERENCES customers(uuid) ON DELETE CASCADE,
    amount        NUMERIC(15,2) NOT NULL,
    payment_date  TIMESTAMPTZ NOT NULL,
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 10. JOURNAL DES RÈGLEMENTS FOURNISSEURS
CREATE TABLE IF NOT EXISTS supplier_payments (
    uuid          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_uuid UUID NOT NULL REFERENCES suppliers(uuid) ON DELETE CASCADE,
    amount        NUMERIC(15,2) NOT NULL,
    payment_date  TIMESTAMPTZ NOT NULL,
    method        TEXT CHECK (method IN ('cash','check','transfer')),
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 11. LOGISTIQUE DE DISTRIBUTION
CREATE TABLE IF NOT EXISTS bread_orders (
    uuid              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_uuid     UUID REFERENCES customers(uuid) ON DELETE SET NULL,
    custom_name       TEXT,
    date              TEXT NOT NULL,
    quantite          NUMERIC(15,3) NOT NULL,
    quantite_origine  NUMERIC(15,3),
    est_paye          BOOLEAN DEFAULT false,
    est_livre         BOOLEAN DEFAULT false,
    is_manual         BOOLEAN DEFAULT false,
    vente_uuid        UUID REFERENCES sales(uuid) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AUDIT DES STOCKS (LOGS)
CREATE TABLE IF NOT EXISTS inventory_logs (
    uuid              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_uuid      UUID REFERENCES products(uuid) ON DELETE CASCADE,
    change            NUMERIC(15,3) NOT NULL,
    new_quantity      NUMERIC(15,3) NOT NULL,
    reason            TEXT NOT NULL,
    related_uuid      UUID,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════
-- A. FONCTIONS & TRIGGERS POUR MISE À JOUR AUTOMATIQUE
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_updated_at_trigger ON %I', t);
        EXECUTE format('CREATE TRIGGER update_updated_at_trigger BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t);
    END LOOP;
END;
$$;

-- ══════════════════════════════════════════════════════════
-- B. INDEX DE PERFORMANCE
-- ══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_customers_search ON customers(search_name);
CREATE INDEX IF NOT EXISTS idx_customers_debt ON customers(outstanding_balance);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_uuid);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_logs(product_uuid);

-- ══════════════════════════════════════════════════════════
-- C. SÉCURITÉ (DÉSACTIVATION RLS POUR ACCÈS LOCAL)
-- ══════════════════════════════════════════════════════════
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', t);
    END LOOP;
END;
$$;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
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
                                    <DialogTitle className="text-lg font-semibold tracking-tight">Initialisation Saphir Elite</DialogTitle>
                                    <DialogDescription className="font-medium text-[10px] uppercase text-primary/50">Schéma souverain certifié compatible v2.0.1</DialogDescription>
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

                    <div className="p-6 bg-muted/5 border-t border-white/5 text-center flex justify-between items-center px-8">
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground opacity-40 italic">
                            Utilisez l'éditeur SQL de Supabase pour exécuter ce code.
                        </p>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                            <Check className="h-3 w-3" /> Schéma Validé
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
