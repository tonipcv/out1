-- Create Salon table for beauty salons
-- Fields: nome, endereco, instagram, email, telefone, site, numeroDeUnidades, timestamps

BEGIN;

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public."Salon" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome TEXT NOT NULL,
  endereco TEXT,
  instagram TEXT,
  email TEXT,
  telefone TEXT,
  site TEXT,
  "numeroDeUnidades" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- keep nome searchable
CREATE INDEX IF NOT EXISTS "Salon_nome_idx" ON public."Salon" (nome);

-- keep updatedAt updated automatically if desired (requires trigger); optional: skip to keep simple
-- Uncomment if you have pgcrypto extension and want trigger auto-update
-- CREATE OR REPLACE FUNCTION public.set_updated_at()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW."updatedAt" = now();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
-- DROP TRIGGER IF EXISTS salon_set_updated_at ON public."Salon";
-- CREATE TRIGGER salon_set_updated_at
-- BEFORE UPDATE ON public."Salon"
-- FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
