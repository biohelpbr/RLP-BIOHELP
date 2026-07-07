-- F-V35 fase 1 — captura de atribuição de afiliado (loja).
-- Aditiva e idempotente. Só cria tabelas novas; não toca em nada existente.
-- A gravação é gated pela flag AFFILIATE_CAPTURE (código) + bloco isolado no webhook.
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS public.affiliate_sales;
--   DROP TABLE IF EXISTS public.affiliate_customer_origin;

-- 1) Venda atribuída a um afiliado (1 linha por pedido+afiliado).
CREATE TABLE IF NOT EXISTS public.affiliate_sales (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_order_id    TEXT NOT NULL,
  order_id            UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  affiliate_member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  buyer_member_id     UUID REFERENCES public.members(id) ON DELETE SET NULL,
  customer_email      TEXT,
  coupon_code         TEXT NOT NULL,
  gross_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_self_purchase    BOOLEAN NOT NULL DEFAULT false,
  reference_month     DATE NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT affiliate_sales_order_affiliate_uniq UNIQUE (shopify_order_id, affiliate_member_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_sales_affiliate_month
  ON public.affiliate_sales (affiliate_member_id, reference_month);
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_customer
  ON public.affiliate_sales (customer_email);

-- 2) Originador do cliente (first-touch: 1 linha por e-mail de cliente).
CREATE TABLE IF NOT EXISTS public.affiliate_customer_origin (
  customer_email        TEXT PRIMARY KEY,
  originador_member_id  UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  first_shopify_order_id TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: admin lê tudo; escrita só via service_role (webhook). Segue o padrão do projeto.
ALTER TABLE public.affiliate_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_customer_origin ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='affiliate_sales' AND policyname='affiliate_sales_admin_read') THEN
    CREATE POLICY affiliate_sales_admin_read ON public.affiliate_sales FOR SELECT USING (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='affiliate_customer_origin' AND policyname='affiliate_origin_admin_read') THEN
    CREATE POLICY affiliate_origin_admin_read ON public.affiliate_customer_origin FOR SELECT USING (is_admin());
  END IF;
END $$;

COMMENT ON TABLE public.affiliate_sales IS 'F-V35: vendas de loja atribuídas a afiliado (via cupom = ref_code).';
COMMENT ON TABLE public.affiliate_customer_origin IS 'F-V35: 1º afiliado que trouxe cada cliente (perpétua).';
