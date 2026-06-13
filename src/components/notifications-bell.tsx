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
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80 relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 && <p className="px-3 py-6 text-sm text-muted-foreground text-center">You're all caught up.</p>}
        {items.map((n) => (
          <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5" onClick={() => n.link && nav({ to: n.link as never })}>
            <p className="font-medium text-sm">{n.title}</p>
            {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}