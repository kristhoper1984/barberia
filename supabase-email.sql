-- La migracion completa ahora esta en supabase-migration.sql.
-- Ejecuta ese archivo en Supabase SQL Editor.

-- Este bloque se conserva para instalaciones que ya usaron la version anterior.
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

CREATE INDEX IF NOT EXISTS turnos_reservas_recordatorio_idx
  ON public.turnos (date, start, status)
  WHERE status = 'reservado';
