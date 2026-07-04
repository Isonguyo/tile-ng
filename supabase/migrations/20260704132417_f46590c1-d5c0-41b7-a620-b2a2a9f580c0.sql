
-- 1) Extra admin roles
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'support';

-- 2) Platform settings (singleton row) for emergency controls
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  disable_registration BOOLEAN NOT NULL DEFAULT false,
  disable_posting BOOLEAN NOT NULL DEFAULT false,
  disable_payments BOOLEAN NOT NULL DEFAULT false,
  disable_withdrawals BOOLEAN NOT NULL DEFAULT false,
  disable_messaging BOOLEAN NOT NULL DEFAULT false,
  emergency_banner TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);
INSERT INTO public.platform_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
GRANT SELECT ON public.platform_settings TO anon, authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads platform settings" ON public.platform_settings;
CREATE POLICY "Anyone reads platform settings" ON public.platform_settings FOR SELECT TO anon, authenticated USING (true);
