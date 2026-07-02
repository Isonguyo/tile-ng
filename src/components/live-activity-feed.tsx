import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Package, Store } from "lucide-react";

type Event = {
  id: string;
  kind: "listing" | "shop";
  text: string;
  at: number;
};

function ago(ts: number) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

/**
 * Rolling ticker of the newest approved listings and shops, refreshed from
 * a one-time backfill plus a realtime subscription.
 */
export function LiveActivityFeed() {
  const [events, setEvents] = useState<Event[]>([]);
  const [, force] = useState(0);

  useEffect(() => {
    let alive = true;

    (async () => {
      const [{ data: listings }, { data: shops }] = await Promise.all([
        supabase
          .from("listings")
          .select("id, title, location, created_at")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("shops")
          .select("id, business_name, location, created_at")
          .order("created_at", { ascending: false })
          .limit(4),
      ]);
      if (!alive) return;
      const seed: Event[] = [
        ...((listings ?? []) as Array<{ id: string; title: string; location: string | null; created_at: string }>).map(
          (l) => ({
            id: `l:${l.id}`,
            kind: "listing" as const,
            text: `New listing · ${l.title}${l.location ? ` · ${l.location}` : ""}`,
            at: new Date(l.created_at).getTime(),
          }),
        ),
        ...((shops ?? []) as Array<{ id: string; business_name: string | null; location: string | null; created_at: string }>).map(
          (s) => ({
            id: `s:${s.id}`,
            kind: "shop" as const,
            text: `Shop opened · ${s.business_name ?? "New shop"}${s.location ? ` · ${s.location}` : ""}`,
            at: new Date(s.created_at).getTime(),
          }),
        ),
      ]
        .sort((a, b) => b.at - a.at)
        .slice(0, 10);
      setEvents(seed);
    })();

    const channel = supabase
      .channel("home-live-activity")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "listings" },
        (payload) => {
          const l = payload.new as { id: string; title?: string; location?: string | null; status?: string };
          if (l.status && l.status !== "approved") return;
          setEvents((prev) =>
            [
              {
                id: `l:${l.id}`,
                kind: "listing" as const,
                text: `New listing · ${l.title ?? "Item"}${l.location ? ` · ${l.location}` : ""}`,
                at: Date.now(),
              },
              ...prev,
            ].slice(0, 10),
          );
        },
      )
      .subscribe();

    const tick = setInterval(() => force((n) => n + 1), 30_000);

    return () => {
      alive = false;
      supabase.removeChannel(channel);
      clearInterval(tick);
    };
  }, []);

  if (!events.length) return null;

  return (
    <div className="rounded-2xl border bg-background/60 backdrop-blur p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" /> Live on Tile right now
        </h3>
      </div>
      <ul className="space-y-2 max-h-52 overflow-hidden">
        {events.map((e) => {
          const Icon = e.kind === "listing" ? Package : Store;
          return (
            <li
              key={e.id}
              className="flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1 duration-500"
            >
              <div className="h-7 w-7 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="flex-1 min-w-0 truncate text-foreground/90">{e.text}</span>
              <span className="text-xs text-muted-foreground shrink-0 font-mono">{ago(e.at)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}