import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import { MessageCircle, ImageIcon, Pin, Sparkles } from "lucide-react";
import { getSignedUrl } from "@/lib/storage";
import { usePlan, hasCapability } from "@/hooks/use-plan";
import { toast } from "sonner";

export const Route = createFileRoute("/messages/")({
  head: () => ({ meta: [{ title: "Inbox — Tile" }] }),
  component: InboxPage,
});

type ChatRow = {
  id: string;
  listing_id: string;
  listing_title: string | null;
  listing_image: string | null;
  other_id: string;
  other_name: string | null;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
  pinned_at: string | null;
};

function InboxPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const { data: plan } = usePlan();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  const { data: chats = [], isLoading, refetch } = useQuery({
    queryKey: ["my-chats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_chats" as never);
      if (error) throw error;
      return (data ?? []) as ChatRow[];
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`inbox-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => refetch())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chats" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, refetch]);

  if (loading || isLoading) return <div className="min-h-screen bg-background"><SiteHeader /><LoadingSpinner label="Loading inbox…" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><MessageCircle className="h-6 w-6" />Inbox</h1>
            <p className="text-sm text-muted-foreground mt-1">A premium marketplace inbox with pinned conversations and smarter handoffs.</p>
          </div>
          {hasCapability(plan, "premium_inbox") ? (
            <Badge className="bg-accent text-accent-foreground"><Sparkles className="mr-1 h-3 w-3" /> Premium inbox</Badge>
          ) : (
            <Badge variant="secondary">Standard inbox</Badge>
          )}
        </div>
        {chats.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No conversations yet. Browse listings and message a vendor to get started.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {chats.map((c) => <ChatRowItem key={c.id} c={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatRowItem({ c }: { c: ChatRow }) {
  const [img, setImg] = useState<string | null>(null);
  const [pinned, setPinned] = useState(Boolean(c.pinned_at));
  useEffect(() => { if (c.listing_image) getSignedUrl(c.listing_image).then(setImg); }, [c.listing_image]);
  const t = c.last_message_at ? new Date(c.last_message_at) : null;
  const time = t ? (Date.now() - t.getTime() < 86400000
    ? t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : t.toLocaleDateString()) : "";

  const togglePin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { data, error } = await supabase.rpc("toggle_chat_pin", { _chat_id: c.id });
    if (error) return toast.error(error.message);
    setPinned(Boolean(data));
    toast.success(data ? "Conversation pinned" : "Conversation unpinned");
  };

  return (
    <Link to="/messages/$chatId" params={{ chatId: c.id }} className="block">
      <Card className={`p-3 flex gap-3 items-center hover:bg-muted/50 transition-colors ${pinned ? "border-accent/40" : ""}`}>
        <div className="h-14 w-14 rounded-lg bg-muted shrink-0 overflow-hidden grid place-items-center">
          {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <p className="font-semibold truncate">{c.other_name ?? "User"}</p>
              {pinned && <Pin className="h-3.5 w-3.5 text-accent shrink-0" />}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{time}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{c.listing_title ?? "Listing"}</p>
          <div className="flex justify-between items-center gap-2 mt-0.5">
            <p className="text-sm text-foreground/80 truncate">{c.last_message ?? <span className="italic text-muted-foreground">No messages yet</span>}</p>
            <div className="flex items-center gap-2 shrink-0">
              {c.unread_count > 0 && <Badge className="bg-accent text-accent-foreground">{c.unread_count}</Badge>}
              <button type="button" onClick={togglePin} className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <Pin className={`h-3.5 w-3.5 ${pinned ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}