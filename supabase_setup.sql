-- ══════════════════════════════════════════════════════════════════════════════
-- iPOS Zen — Script de Configuration Saphir (Supabase Cloud)
-- Version: 1.9.8
-- Expertise: PostgreSQL / Droit Commercial Algérien
-- Description: Initialisation idempotente du schéma de sauvegarde Cloud.
-- ══════════════════════════════════════════════════════════════════════════════

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ════════════════════════════════════════
-- A. FONCTIONS GLOBALES & TRIGGERS
-- ════════════════════════════════════════

-- Fonction pour mettre à jour automatiquement le champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ════════════════════════════════════════
-- B. CRÉATION DES TABLES (ORDRE HIÉRARCHIQUE)
-- ════════════════════════════════════════

-- 1. Profil de l'établissement
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
  -- Champs fiscaux légaux (Algérie)
  rc_number             TEXT,   -- Registre de Commerce WW/BB-NNNNNNN
  nif                   TEXT,   -- Identification Fiscale 15 chiffres
  ai_number             TEXT,   -- Article d'Imposition
  nis_number            TEXT,   -- Numéro Statistique
  tva_number            TEXT,   -- N° TVA intracommunautaire (si applicable)
  legal_form            TEXT,   -- SARL, EURL, Auto-entrepreneur...
  tva_rate              SMALLINT DEFAULT 19 CHECK (tva_rate IN (0, 9, 19)),
  is_tva_exempt         BOOLEAN DEFAULT false,
  tva_exempt_reason     TEXT,
  -- Logique de facturation
  invoice_prefix        TEXT DEFAULT 'FAC',
  invoice_counter       BIGINT DEFAULT 1,
  -- Paramètres métiers
  gold_price_per_gram   NUMERIC(15,2) DEFAULT 0,
  bread_price_per_unit  NUMERIC(15,2) DEFAULT 0,
  -- Synchronisation
  supabase_url          TEXT,
  supabase_key          TEXT,
  last_sync_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Partenaires Fournisseurs
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

-- 3. Fichier Clients
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
  -- Module Pain
  is_bread_client       BOOLEAN DEFAULT false,
  bread_type_recurrence TEXT CHECK (bread_type_recurrence IN ('quotidien','jours_specifiques','aucun')),
  bread_quantite_defaut NUMERIC(15,3) DEFAULT 0,
  bread_jours_semaine   JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Catalogue Produits
CREATE TABLE IF NOT EXISTS products (
  uuid              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  category          TEXT,
  price             NUMERIC(15,2) NOT NULL DEFAULT 0,
  purchase_price    NUMERIC(15,2) NOT NULL DEFAULT 0,
  quantity          NUMERIC(15,3) NOT NULL DEFAULT 0,
  min_stock_level   NUMERIC(15,3) NOT NULL DEFAULT 10,
  barcodes          JSONB DEFAULT '[]', -- Stockage array de strings
  unite             TEXT DEFAULT 'Pièce',
  date_expiration   TIMESTAMPTZ,
  supplier_uuid     UUID REFERENCES suppliers(uuid) ON DELETE SET NULL,
  date_maj_prix     TIMESTAMPTZ,
  stock_status      TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock','low_stock','out_of_stock')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Registre des Charges (Dépenses)
CREATE TABLE IF NOT EXISTS expenses (
  uuid          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description   TEXT NOT NULL,
  amount        NUMERIC(15,2) NOT NULL,
  category      TEXT DEFAULT 'Autre',
  expense_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Manifestes de Réception (Achats Stock)
CREATE TABLE IF NOT EXISTS stock_intakes (
  uuid              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_uuid     UUID REFERENCES suppliers(uuid) ON DELETE SET NULL,
  invoice_number    TEXT,
  invoice_date      TIMESTAMPTZ,
  items             JSONB NOT NULL DEFAULT '[]', -- Liste des articles reçus
  total_value       NUMERIC(15,2) DEFAULT 0,
  shipping_cost     NUMERIC(15,2) DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Grand Livre des Ventes
CREATE TABLE IF NOT EXISTS sales (
  uuid              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number    TEXT NOT NULL UNIQUE,
  items             JSONB NOT NULL DEFAULT '[]', -- Détail de la vente
  subtotal          NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_type     TEXT CHECK (discount_type IN ('fixed','percentage')),
  discount_amount   NUMERIC(15,2) DEFAULT 0,
  total             NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount_paid       NUMERIC(15,2) DEFAULT 0,
  remaining_balance NUMERIC(15,2) DEFAULT 0,
  payment_status    TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid','partial','unpaid')),
  customer_uuid     UUID REFERENCES customers(uuid) ON DELETE SET NULL,
  due_date          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Registre des Retours Marchandises
CREATE TABLE IF NOT EXISTS product_returns (
  uuid                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_sale_uuid      UUID REFERENCES sales(uuid) ON DELETE SET NULL,
  original_invoice_number TEXT,
  items                   JSONB NOT NULL DEFAULT '[]',
  total_return_value      NUMERIC(15,2) DEFAULT 0,
  amount_refunded         NUMERIC(15,2) DEFAULT 0,
  customer_uuid           UUID REFERENCES customers(uuid) ON DELETE SET NULL,
  notes                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Journal des Encaissements (Paiements Clients)
CREATE TABLE IF NOT EXISTS payments (
  uuid          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_uuid UUID NOT NULL REFERENCES customers(uuid) ON DELETE CASCADE,
  amount        NUMERIC(15,2) NOT NULL,
  payment_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Logistique du Pain (Commandes journalières)
CREATE TABLE IF NOT EXISTS bread_orders (
  uuid              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_uuid     UUID REFERENCES customers(uuid) ON DELETE SET NULL,
  custom_name       TEXT,
  date              DATE NOT NULL,
  quantite          NUMERIC(15,3) NOT NULL DEFAULT 0,
  quantite_origine  NUMERIC(15,3),
  is_manual         BOOLEAN DEFAULT false,
  est_paye          BOOLEAN DEFAULT false,
  est_livre         BOOLEAN DEFAULT false,
  vente_uuid        UUID REFERENCES sales(uuid) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Journal d'Audit des Stocks
CREATE TABLE IF NOT EXISTS inventory_logs (
  uuid              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_uuid      UUID REFERENCES products(uuid) ON DELETE SET NULL,
  change_type       TEXT NOT NULL CHECK (change_type IN ('sale','return','stock_intake','manual_adjustment','cancellation')),
  quantity_change   NUMERIC(15,3) NOT NULL,
  quantity_before   NUMERIC(15,3),
  quantity_after    NUMERIC(15,3),
  reference_uuid    UUID, -- UUID de la vente ou du stock_intake lié
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Journal des Règlements Fournisseurs
CREATE TABLE IF NOT EXISTS supplier_payments (
  uuid          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_uuid UUID NOT NULL REFERENCES suppliers(uuid) ON DELETE CASCADE,
  amount        NUMERIC(15,2) NOT NULL,
  payment_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method        TEXT CHECK (method IN ('cash','check','transfer')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════
-- C. ATTACHEMENT DES TRIGGERS (UPDATED_AT)
-- ════════════════════════════════════════

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name != 'inventory_logs' -- Les logs sont immuables
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_update_timestamp ON %I', t);
        EXECUTE format('CREATE TRIGGER trigger_update_timestamp BEFORE UPDATE ON %I FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()', t);
    END LOOP;
END;
$$;

-- ════════════════════════════════════════
-- D. INDEX DE PERFORMANCE
-- ════════════════════════════════════════

-- Optimisation des recherches clients
CREATE INDEX IF NOT EXISTS idx_customers_search_name ON customers(search_name);
CREATE INDEX IF NOT EXISTS idx_customers_outstanding ON customers(outstanding_balance);
CREATE INDEX IF NOT EXISTS idx_customers_bread ON customers(is_bread_client);

-- Optimisation des ventes et dates
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_uuid);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at DESC);

-- Optimisation catalogue
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_uuid);

-- Optimisation audit et logistique
CREATE INDEX IF NOT EXISTS idx_logs_product ON inventory_logs(product_uuid);
CREATE INDEX IF NOT EXISTS idx_bread_date ON bread_orders(date);

-- ════════════════════════════════════════
-- E. SÉCURITÉ & ACCÈS (RLS & GRANTS)
-- ════════════════════════════════════════

-- Désactivation explicite du RLS pour usage POS local mono-utilisateur
ALTER TABLE company_profile   DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers         DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers         DISABLE ROW LEVEL SECURITY;
ALTER TABLE products          DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses          DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_intakes     DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales             DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_returns   DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments          DISABLE ROW LEVEL SECURITY;
ALTER TABLE bread_orders      DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs    DISABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments DISABLE ROW LEVEL SECURITY;

-- Autorisations pour l'application
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ════════════════════════════════════════
-- F. DOCUMENTATION (COMMENTAIRES)
-- ════════════════════════════════════════

COMMENT ON TABLE company_profile IS 'Profil unique du commerce. Contient les infos légales algériennes (NIF, RC, AI).';
COMMENT ON COLUMN company_profile.nif IS 'Numéro d''Identification Fiscale — 15 chiffres — obligatoire sur facture.';
COMMENT ON COLUMN customers.outstanding_balance IS 'Dette actuelle du client (créance).';
COMMENT ON COLUMN products.barcodes IS 'Array JSON des codes-barres associés au produit.';
COMMENT ON COLUMN inventory_logs.change_type IS 'Nature du mouvement de stock (vente, retour, achat, correction).';

-- ════════════════════════════════════════
-- G. VÉRIFICATION FINALE
-- ════════════════════════════════════════

SELECT 
    table_name, 
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) AS taille_totale
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY pg_total_relation_size(quote_ident(table_name)::regclass) DESC;
