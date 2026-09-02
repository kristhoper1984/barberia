-- Ejecutar en Supabase SQL Editor.
-- Esta migracion conserva la tabla turnos existente y agrega los datos de clientes.

ALTER TABLE public.turnos
  ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.turnos
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'reservado';

ALTER TABLE public.turnos
  ADD COLUMN IF NOT EXISTS date text,
  ADD COLUMN IF NOT EXISTS start text,
  ADD COLUMN IF NOT EXISTS "end" text,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS service text,
  ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS public.clientes (
  email text PRIMARY KEY CHECK (position('@' in email) > 1),
  name text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS turnos_reservas_recordatorio_idx
  ON public.turnos (date, start, status)
  WHERE status = 'reservado';

ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Politicas necesarias para la app sin login de Supabase en esta etapa.
-- Cuando se active Supabase Auth, deben reemplazarse por politicas por usuario.
DROP POLICY IF EXISTS app_turnos_select ON public.turnos;
CREATE POLICY app_turnos_select ON public.turnos FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS app_turnos_insert ON public.turnos;
CREATE POLICY app_turnos_insert ON public.turnos FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS app_turnos_update ON public.turnos;
CREATE POLICY app_turnos_update ON public.turnos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS app_turnos_delete ON public.turnos;
CREATE POLICY app_turnos_delete ON public.turnos FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS app_clientes_select ON public.clientes;
CREATE POLICY app_clientes_select ON public.clientes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS app_clientes_insert ON public.clientes;
CREATE POLICY app_clientes_insert ON public.clientes FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS app_clientes_update ON public.clientes;
CREATE POLICY app_clientes_update ON public.clientes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
