DO $migration$
DECLARE
  definition text;
BEGIN
  SELECT pg_get_functiondef('public.get_vendor_analytics(integer)'::regprocedure)
  INTO definition;

  definition := replace(definition, 't.views DESC', 't.views_count DESC');

  IF definition NOT LIKE '%t.views_count DESC%' THEN
    RAISE EXCEPTION 'Expected get_vendor_analytics ordering expression was not found';
  END IF;

  EXECUTE definition;
END;
$migration$;

NOTIFY pgrst, 'reload schema';