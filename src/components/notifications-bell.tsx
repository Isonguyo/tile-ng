import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";

type Notif = { id: string; title: string; body: string | null; link: string | null; read: boolean; created_at: string };

export function NotificationsBell() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20);
      setItems((data as Notif[]) ?? []);
    };
    load();
    const ch = supabase.channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (p) => setItems((m) => [p.new as Notif, ...m]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  if (!user) return null;
  const unread = items.filter((i) => !i.read).length;

  const open = async () => {
    if (unread > 0) {
      await supabase.rpc("mark_notifications_read");
      setItems((m) => m.map((i) => ({ ...i, read: true })));
    }
  };

  return (
    <DropdownMenu onOpenChange={(o) => o && open()}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-200 hover:text-[#22C55E] hover:bg-[#102A1C]/60 rounded-xl transition-all duration-200"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto rounded-2xl border border-[#163321] bg-[#081810]/95 backdrop-blur-xl p-1.5 text-slate-200 shadow-2xl shadow-black/80"
      >
        <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-[#22C55E] px-3 py-2">
          Notifications
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#163321]" />
        {items.length === 0 && (
          <p className="px-3 py-8 text-xs text-slate-400 text-center">You're all caught up.</p>
        )}
        {items.map((n) => (
          <DropdownMenuItem
            key={n.id}
            className="flex flex-col items-start gap-1 p-2.5 rounded-xl hover:bg-[#102A1C]/70 focus:bg-[#102A1C] cursor-pointer transition-colors"
            onClick={() => n.link && nav({ to: n.link as never })}
          >
            <p className="font-semibold text-xs text-slate-100">{n.title}</p>
            {n.body && <p className="text-[11px] text-slate-400 leading-snug">{n.body}</p>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}