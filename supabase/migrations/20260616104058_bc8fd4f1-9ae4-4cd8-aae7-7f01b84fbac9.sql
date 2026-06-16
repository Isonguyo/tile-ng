-- 1. read_at column for read receipts / unread counters
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at timestamptz;
CREATE INDEX IF NOT EXISTS messages_chat_created_idx ON public.messages(chat_id, created_at);

-- 2. Realtime publication (idempotent)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.chats REPLICA IDENTITY FULL;

-- 3. RLS hardening (idempotent)
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chats_select_own" ON public.chats;
CREATE POLICY "chats_select_own" ON public.chats FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "chats_insert_buyer" ON public.chats;
CREATE POLICY "chats_insert_buyer" ON public.chats FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "messages_select_own_chat" ON public.messages;
CREATE POLICY "messages_select_own_chat" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())));

DROP POLICY IF EXISTS "messages_insert_own_chat" ON public.messages;
CREATE POLICY "messages_insert_own_chat" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.chats c WHERE c.id = chat_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  ));

DROP POLICY IF EXISTS "messages_update_read" ON public.messages;
CREATE POLICY "messages_update_read" ON public.messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())));

-- 4. Conversation list RPC
CREATE OR REPLACE FUNCTION public.my_chats()
RETURNS TABLE (
  id uuid,
  listing_id uuid,
  listing_title text,
  listing_image text,
  other_id uuid,
  other_name text,
  last_message text,
  last_message_at timestamptz,
  unread_count bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  RETURN QUERY
    SELECT
      c.id,
      c.listing_id,
      l.title,
      CASE WHEN array_length(l.images, 1) > 0 THEN l.images[1] ELSE NULL END,
      CASE WHEN c.buyer_id = auth.uid() THEN c.seller_id ELSE c.buyer_id END,
      p.full_name,
      (SELECT m.content FROM public.messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1),
      COALESCE((SELECT m.created_at FROM public.messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1), c.created_at),
      (SELECT count(*) FROM public.messages m WHERE m.chat_id = c.id AND m.sender_id <> auth.uid() AND m.read_at IS NULL)
    FROM public.chats c
    LEFT JOIN public.listings l ON l.id = c.listing_id
    LEFT JOIN public.profiles p ON p.id = (CASE WHEN c.buyer_id = auth.uid() THEN c.seller_id ELSE c.buyer_id END)
    WHERE c.buyer_id = auth.uid() OR c.seller_id = auth.uid()
    ORDER BY 8 DESC NULLS LAST;
END $$;

REVOKE EXECUTE ON FUNCTION public.my_chats() FROM anon;
GRANT EXECUTE ON FUNCTION public.my_chats() TO authenticated;

-- 5. Mark chat read
CREATE OR REPLACE FUNCTION public.mark_chat_read(_chat_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.chats WHERE id = _chat_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())) THEN
    RAISE EXCEPTION 'Not a participant';
  END IF;
  UPDATE public.messages SET read_at = now()
    WHERE chat_id = _chat_id AND sender_id <> auth.uid() AND read_at IS NULL;
END $$;

REVOKE EXECUTE ON FUNCTION public.mark_chat_read(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_chat_read(uuid) TO authenticated;

-- 6. Ensure-or-create chat (atomic)
CREATE OR REPLACE FUNCTION public.ensure_chat(_listing_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _seller uuid; _existing uuid; _new uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT user_id INTO _seller FROM public.listings WHERE id = _listing_id;
  IF _seller IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
  IF _seller = auth.uid() THEN RAISE EXCEPTION 'You cannot chat with yourself'; END IF;

  SELECT id INTO _existing FROM public.chats
    WHERE listing_id = _listing_id AND buyer_id = auth.uid() LIMIT 1;
  IF _existing IS NOT NULL THEN RETURN _existing; END IF;

  INSERT INTO public.chats(listing_id, buyer_id, seller_id)
    VALUES (_listing_id, auth.uid(), _seller) RETURNING id INTO _new;
  RETURN _new;
END $$;

REVOKE EXECUTE ON FUNCTION public.ensure_chat(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.ensure_chat(uuid) TO authenticated;