import { useQuery } from "@tanstack/react-query";
import { BarChart3, Eye, Heart, MessageCircle, MousePointerClick, Phone, Share2, Store, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { rpcUntyped } from "@/lib/waitlist-rpc";
import { hasVendorAnalytics } from "@/hooks/use-tile-entitlements";

type Row = Record<string, unknown>;
type MetricKey =
  | "liveListings"
  | "totalViews"
  | "totalClicks"
  | "totalSaves"
  | "ctr"
  | "activeTopAds"
  | "views"
  | "impressions"
  | "saves"
  | "chats"
  | "whatsappClicks"
  | "phoneClicks"
  | "shares";

type AnalyticsPayload = {
  metrics: Partial<Record<MetricKey, string | number>>;
  topListings: Array<{
    id: string;
    title: string;
    views: string | number | null;
    clicks: string | number | null;
    saves: string | number | null;
    ctr: string | number | null;
  }>;
};

const ALIASES: Record<MetricKey, string[]> = {
  liveListings: ["live_listings", "active_listings", "live_listing_count"],
  totalViews: ["total_views", "all_time_views"],
  totalClicks: ["total_clicks", "all_time_clicks"],
  totalSaves: ["total_saves", "all_time_saves", "favorites"],
  ctr: ["ctr", "click_through_rate"],
  activeTopAds: ["active_top_ads", "top_ads_active"],
  views: ["views", "view_count"],
  impressions: ["impressions", "impression_count"],
  saves: ["saves", "save_count"],
  chats: ["chats", "chat_count"],
  whatsappClicks: ["whatsapp_clicks", "whatsapp_click_count"],
  phoneClicks: ["phone_clicks", "phone_click_count"],
  shares: ["shares", "share_count"],
};

function asRow(value: unknown): Row | null {
  if (Array.isArray(value)) return asRow(value[0]);
  return value && typeof value === "object" ? value as Row : null;
}

function firstMetric(sources: Row[], keys: string[]): string | number | undefined {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "number" || typeof value === "string") return value;
    }
  }
  return undefined;
}

function normalizeAnalytics(value: unknown): AnalyticsPayload {
  const root = asRow(value) ?? {};
  const summary = asRow(root.summary) ?? asRow(root.totals) ?? {};
  const recent = asRow(root.recent_metrics) ?? asRow(root.last_30_days) ??
    asRow(root.recent) ?? asRow(root.events) ?? {};
  const metrics: AnalyticsPayload["metrics"] = {};

  for (const key of ["liveListings", "totalViews", "totalClicks", "totalSaves", "ctr", "activeTopAds"] as const) {
    const found = firstMetric([summary, root], ALIASES[key]);
    if (found !== undefined) metrics[key] = found;
  }
  for (const key of ["views", "impressions", "saves", "chats", "whatsappClicks", "phoneClicks", "shares"] as const) {
    const found = firstMetric([recent, root], ALIASES[key]);
    if (found !== undefined) metrics[key] = found;
  }

  const candidateListings = root.top_performing_listings ?? root.top_listings ?? root.listings ?? [];
  const topListings = (Array.isArray(candidateListings) ? candidateListings : [])
    .map((item, index) => {
      const row = asRow(item) ?? {};
      const metric = (keys: string[]) => {
        const value = firstMetric([row], keys);
        return value === undefined ? null : value;
      };
      return {
        id: typeof row.id === "string" ? row.id : "listing-" + index,
        title: typeof row.title === "string" ? row.title : "Listing",
        views: metric(["views", "total_views", "view_count"]),
        clicks: metric(["clicks", "total_clicks", "click_count"]),
        saves: metric(["saves", "total_saves", "save_count"]),
        ctr: metric(["ctr", "click_through_rate"]),
      };
    });
  return { metrics, topListings };
}

function formatted(value: string | number | null | undefined, suffix = ""): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return value.toLocaleString() + suffix;
  return value + suffix;
}

const SUMMARY: Array<{ key: MetricKey; label: string; icon: typeof Store }> = [
  { key: "liveListings", label: "Live Listings", icon: Store },
  { key: "totalViews", label: "Total Views", icon: Eye },
  { key: "totalClicks", label: "Total Clicks", icon: MousePointerClick },
  { key: "totalSaves", label: "Total Saves", icon: Heart },
  { key: "ctr", label: "CTR", icon: BarChart3 },
  { key: "activeTopAds", label: "Active Top Ads", icon: Video },
];

const RECENT: Array<{ key: MetricKey; label: string; icon: typeof Store }> = [
  { key: "views", label: "Views", icon: Eye },
  { key: "impressions", label: "Impressions", icon: MousePointerClick },
  { key: "saves", label: "Saves", icon: Heart },
  { key: "chats", label: "Chats", icon: MessageCircle },
  { key: "whatsappClicks", label: "WhatsApp clicks", icon: MessageCircle },
  { key: "phoneClicks", label: "Phone clicks", icon: Phone },
  { key: "shares", label: "Shares", icon: Share2 },
];

export function VendorAnalyticsCard({
  userId,
  analyticsLevel,
  entitlementsLoading = false,
  className,
}: {
  userId: string;
  analyticsLevel?: string | null;
  entitlementsLoading?: boolean;
  className?: string;
}) {
  const enabled = hasVendorAnalytics(analyticsLevel);
  const query = useQuery({
    queryKey: ["vendor-analytics", userId],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("get_vendor_analytics", { _days: 30 });
      if (error) throw error;
      return normalizeAnalytics(data);
    },
  });

  return (
    <Card id="vendor-analytics" className={"overflow-hidden p-5 sm:p-6 " + (className ?? "border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] text-slate-100")}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">Merchant insights</p>
          <h3 className="mt-1 flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="h-5 w-5 text-emerald-300" />Basic Analytics
          </h3>
        </div>
        <span className="w-fit rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">Last 30 days</span>
      </div>

      {entitlementsLoading && (
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6" aria-label="Checking analytics access">
          {SUMMARY.map(({ key, label }) => (
            <div key={key} className="min-h-[76px] animate-pulse rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <div className="mt-3 h-5 w-16 rounded bg-white/[0.06]" />
            </div>
          ))}
        </div>
      )}
      {!entitlementsLoading && !enabled && (
        <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-black/10 p-4 text-sm text-slate-400">
          Basic Analytics is available with an eligible Tile plan.
        </div>
      )}
      {!entitlementsLoading && enabled && query.isLoading && <p className="py-10 text-center text-sm text-slate-400">Loading your analytics…</p>}
      {!entitlementsLoading && enabled && query.isError && (
        <div className="mt-5 rounded-xl border border-rose-300/15 bg-rose-300/[0.05] p-4 text-sm text-slate-300">
          <p>Analytics couldn't be loaded right now.</p>
          <Button variant="outline" size="sm" className="mt-3 border-white/15 bg-transparent" onClick={() => void query.refetch()}>Try again</Button>
        </div>
      )}
      {!entitlementsLoading && enabled && query.data && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {SUMMARY.map(({ key, label, icon: Icon }) => (
              <div key={key} className="min-w-0 rounded-xl border border-white/[0.07] bg-[#07170f]/75 p-3 sm:p-3.5">
                <div className="flex items-center gap-2 text-slate-500"><Icon className="h-4 w-4 shrink-0 text-emerald-300/80" /><span className="truncate text-[10px] font-semibold uppercase tracking-wide">{label}</span></div>
                <p className="mt-2 truncate text-lg font-bold text-slate-100">{formatted(query.data.metrics[key], key === "ctr" ? "%" : "")}</p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-200">Recent activity</h4>
              <span className="text-[11px] text-slate-500">Returned event metrics</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {RECENT.map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex min-w-0 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                  <div className="min-w-0"><p className="truncate text-[10px] text-slate-500">{label}</p><p className="truncate text-sm font-semibold">{formatted(query.data.metrics[key])}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 border-t border-white/[0.07] pt-4">
            <h4 className="text-sm font-semibold text-slate-200">Top Performing Listings</h4>
            {query.data.topListings.length === 0 ? (
              <p className="mt-2 rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">No listing performance rows were returned for this period.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {query.data.topListings.map((listing) => (
                  <div key={listing.id} className="grid gap-2 rounded-xl border border-white/[0.06] bg-[#07170f]/60 p-3 sm:grid-cols-[minmax(0,1fr)_repeat(4,minmax(60px,auto))] sm:items-center">
                    <p className="truncate text-sm font-medium text-slate-200">{listing.title}</p>
                    <span className="text-xs text-slate-400">Views {formatted(listing.views)}</span>
                    <span className="text-xs text-slate-400">Clicks {formatted(listing.clicks)}</span>
                    <span className="text-xs text-slate-400">Saves {formatted(listing.saves)}</span>
                    <span className="text-xs text-slate-400">CTR {formatted(listing.ctr, listing.ctr === null ? "" : "%")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
