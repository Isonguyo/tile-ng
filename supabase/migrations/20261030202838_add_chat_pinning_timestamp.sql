ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS pinned_at timestamptz;
NOTIFY pgrst, 'reload schema';