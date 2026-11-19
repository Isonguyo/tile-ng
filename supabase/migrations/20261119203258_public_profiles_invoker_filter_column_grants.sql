-- The invoker view filter also reads these two publication-state columns.
GRANT SELECT (is_prelaunch,artisan_status) ON TABLE public.profiles TO anon;
