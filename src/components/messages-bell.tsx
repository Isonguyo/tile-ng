import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export function MessagesBell() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  const refresh = async () => {
    const { data } = await supabase.rpc("my_chats" as never);
    const rows = (data ?? []) as Array<{ unread_count: number }>;
    const total = rows.reduce((s, r) => s + Number(r.unread_count ?? 0), 0);
    setUnread((prev) => {
      if (total > prev && typeof window !== "undefined") {
        try {
          const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = 880; g.gain.value = 0.05;
          o.start(); setTimeout(() => { o.stop(); ctx.close(); }, 120);
        } catch { /* ignore */ }
      }
      return total;
    });
  };

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    refresh();
    const ch = supabase.channel(`msg-bell-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;
  return (
    <Button asChild variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80 relative" aria-label={`Messages${unread ? ` (${unread} unread)` : ""}`}>
      <Link to="/messages">
        <MessageCircle className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Link>
    </Button>
  );
}