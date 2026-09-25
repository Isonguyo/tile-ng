ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS expired_at timestamptz;
CREATE OR REPLACE FUNCTION public.expire_old_listings()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ DECLARE n int; BEGIN
  UPDATE public.listings SET status = 'expired', is_promoted = false, expired_at = now()
   WHERE status = 'approved' AND expires_at <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  UPDATE public.listings SET expired_at = now() WHERE status = 'expired' AND expired_at IS NULL;
  DELETE FROM public.listings WHERE status = 'expired' AND expired_at <= now() - interval '30 days';
  RETURN n; END $$;
REVOKE EXECUTE ON FUNCTION public.expire_old_listings() FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public.clear_expired_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN IF NEW.status <> 'expired' THEN NEW.expired_at := NULL; END IF; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS listings_clear_expired_at ON public.listings;
CREATE TRIGGER listings_clear_expired_at BEFORE UPDATE OF status ON public.listings FOR EACH ROW EXECUTE FUNCTION public.clear_expired_at();