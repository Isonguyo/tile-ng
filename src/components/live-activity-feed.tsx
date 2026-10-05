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
        ...(
          (listings ?? []) as Array<{
            id: string;
            title: string;
            location: string | null;
            created_at: string;
          }>
        ).map((l) => ({
          id: `l:${l.id}`,
          kind: "listing" as const,
          text: `New listing · ${l.title}${l.location ? ` · ${l.location}` : ""}`,
          at: new Date(l.created_at).getTime(),
        })),
        ...(
          (shops ?? []) as Array<{
            id: string;
            business_name: string | null;
            location: string | null;
            created_at: string;
          }>
        ).map((s) => ({
          id: `s:${s.id}`,
          kind: "shop" as const,
          text: `Shop opened · ${s.business_name ?? "New shop"}${s.location ? ` · ${s.location}` : ""}`,
          at: new Date(s.created_at).getTime(),
        })),
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
          const l = payload.new as {
            id: string;
            title?: string;
            location?: string | null;
            status?: string;
          };
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
    <div className="rounded-2xl border border-[#163321] bg-[#081810]/80 backdrop-blur-xl p-4 shadow-xl shadow-black/40 relative overflow-hidden">
      {/* Subtle top glow line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#22C55E]/30 to-transparent" />

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3.5 pb-2 border-b border-[#163321]/60">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22C55E]" />
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#22C55E] flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" /> Live on Tile right now
        </h3>
      </div>

      {/* List */}
      <ul className="space-y-2 max-h-52 overflow-hidden">
        {events.map((e) => {
          const Icon = e.kind === "listing" ? Package : Store;
          return (
            <li
              key={e.id}
              className="flex items-center gap-3 text-sm p-1.5 rounded-lg hover:bg-[#102A1C]/50 transition-colors animate-in fade-in slide-in-from-top-1 duration-500 group"
            >
              <div className="h-7 w-7 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 grid place-items-center shrink-0 group-hover:border-[#22C55E]/50 group-hover:bg-[#22C55E]/20 transition-all">
                <Icon className="h-3.5 w-3.5 text-[#22C55E]" />
              </div>
              <span className="flex-1 min-w-0 truncate text-slate-200 group-hover:text-white transition-colors text-xs font-medium">
                {e.text}
              </span>
              <span className="text-[11px] text-slate-400 shrink-0 font-mono bg-[#05100B] px-2 py-0.5 rounded border border-[#163321]">
                {ago(e.at)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
