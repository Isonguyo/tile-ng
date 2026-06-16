import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ArrowLeft, Send, Check, CheckCheck, ImageIcon } from "lucide-react";
import { getSignedUrl } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/messages/$chatId")({
  head: () => ({ meta: [{ title: "Chat — Tile" }] }),
  component: ChatPage,
});

type Msg = { id: string; chat_id: string; sender_id: string; content: string; created_at: string; read_at: string | null };
type ChatMeta = {
  id: string; listing_id: string; buyer_id: string; seller_id: string;
  listing: { title: string; images: string[] | null } | null;
  other: { id: string; full_name: string | null } | null;
};

const PAGE = 50;

function ChatPage() {
  const { chatId } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  const { data: meta } = useQuery<ChatMeta | null>({
    queryKey: ["chat-meta", chatId],
    enabled: !!user,
    queryFn: async () => {
      const { data: c, error } = await supabase.from("chats")
        .select("id,listing_id,buyer_id,seller_id").eq("id", chatId).maybeSingle();
      if (error || !c) return null;
      const otherId = c.buyer_id === user!.id ? c.seller_id : c.buyer_id;
      const [{ data: l }, { data: p }] = await Promise.all([
        supabase.from("listings").select("title,images").eq("id", c.listing_id).maybeSingle(),
        supabase.from("profiles").select("id,full_name").eq("id", otherId).maybeSingle(),
      ]);
      return { ...c, listing: l, other: p } as ChatMeta;
    },
  });

  const [messages, setMessages] = useState<Msg[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial load (latest PAGE)
  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      setLoadingMsgs(true);
      const { data } = await supabase.from("messages").select("*")
        .eq("chat_id", chatId).order("created_at", { ascending: false }).limit(PAGE);
      if (!alive) return;
      const rows = ((data ?? []) as Msg[]).reverse();
      setMessages(rows);
      setHasMore((data?.length ?? 0) >= PAGE);
      setLoadingMsgs(false);
      await supabase.rpc("mark_chat_read" as never, { _chat_id: chatId } as never);
    })();
    return () => { alive = false; };
  }, [chatId, user]);

  // Realtime + typing
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`chat-room-${chatId}`, { config: { broadcast: { self: false } } })
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        (p) => {
          const m = p.new as Msg;
          setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
          if (m.sender_id !== user.id) supabase.rpc("mark_chat_read" as never, { _chat_id: chatId } as never);
        })
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        (p) => {
          const m = p.new as Msg;
          setMessages((prev) => prev.map((x) => x.id === m.id ? m : x));
        })
      .on("broadcast", { event: "typing" }, (p) => {
        if (p.payload?.user_id && p.payload.user_id !== user.id) {
          setOtherTyping(true);
          setTimeout(() => setOtherTyping(false), 2500);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [chatId, user]);

  // Auto-scroll on new message
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, otherTyping]);

  const loadOlder = async () => {
    if (!messages.length || !hasMore) return;
    const oldest = messages[0].created_at;
    const { data } = await supabase.from("messages").select("*")
      .eq("chat_id", chatId).lt("created_at", oldest).order("created_at", { ascending: false }).limit(PAGE);
    const more = ((data ?? []) as Msg[]).reverse();
    setMessages((prev) => [...more, ...prev]);
    setHasMore((data?.length ?? 0) >= PAGE);
  };

  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  useEffect(() => {
    typingChannelRef.current = supabase.channel(`chat-room-${chatId}`);
    return () => { if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current); };
  }, [chatId]);

  const onTyping = (v: string) => {
    setText(v);
    if (typingChannelRef.current && user) {
      typingChannelRef.current.send({ type: "broadcast", event: "typing", payload: { user_id: user.id } });
    }
  };

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user) return;
    const body = text.trim();
    if (!body) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({ chat_id: chatId, sender_id: user.id, content: body });
    setSending(false);
    if (error) return toast.error(error.message);
    setText("");
  };

  if (loading || loadingMsgs) return <div className="min-h-screen bg-background"><SiteHeader /><LoadingSpinner label="Loading chat…" /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <ChatHeader meta={meta} />
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-muted/30">
        <div className="container mx-auto px-3 py-4 max-w-2xl space-y-2">
          {hasMore && (
            <div className="text-center">
              <Button variant="ghost" size="sm" onClick={loadOlder}>Load older messages</Button>
            </div>
          )}
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Say hi to start the conversation 👋</p>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border rounded-bl-sm"}`}>
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <div className={`flex items-center gap-1 mt-1 text-[10px] ${mine ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"}`}>
                    <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {mine && (m.read_at ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                  </div>
                </div>
              </div>
            );
          })}
          {otherTyping && (
            <div className="flex justify-start"><div className="bg-card border rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-muted-foreground italic">typing…</div></div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <form onSubmit={send} className="border-t bg-background p-3">
        <div className="container mx-auto max-w-2xl flex gap-2">
          <Input value={text} onChange={(e) => onTyping(e.target.value)} placeholder="Type a message…" disabled={sending} autoFocus />
          <Button type="submit" disabled={sending || !text.trim()} className="bg-accent text-accent-foreground"><Send className="h-4 w-4" /></Button>
        </div>
      </form>
    </div>
  );
}

function ChatHeader({ meta }: { meta: ChatMeta | null | undefined }) {
  const [img, setImg] = useState<string | null>(null);
  useEffect(() => {
    const first = meta?.listing?.images?.[0];
    if (first) getSignedUrl(first).then(setImg);
  }, [meta?.listing?.images]);
  return (
    <div className="border-b bg-background sticky top-0 z-10">
      <div className="container mx-auto max-w-2xl px-3 py-2 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link to="/messages"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden grid place-items-center shrink-0">
          {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{meta?.other?.full_name ?? "User"}</p>
          {meta?.listing_id && (
            <Link to="/listing/$id" params={{ id: meta.listing_id }} className="text-xs text-accent truncate block">
              {meta?.listing?.title ?? "View listing"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}