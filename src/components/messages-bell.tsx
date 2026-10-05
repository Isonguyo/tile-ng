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
          const ctx = new (
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          )();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = 880;
          g.gain.value = 0.05;
          o.start();
          setTimeout(() => {
            o.stop();
            ctx.close();
          }, 120);
        } catch {
          /* ignore */
        }
      }
      return total;
    });
  };

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    refresh();
    const ch = supabase
      .channel(`msg-bell-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="relative text-slate-200 hover:text-[#22C55E] hover:bg-[#102A1C]/60 rounded-xl transition-all duration-200"
      aria-label={`Messages${unread ? ` (${unread} unread)` : ""}`}
    >
      <Link to="/messages">
        <MessageCircle className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#22C55E] text-[#05100B] text-[10px] font-extrabold grid place-items-center shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Link>
    </Button>
  );
}
