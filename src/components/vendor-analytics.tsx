import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  MousePointerClick,
  Phone,
  Share2,
  Store,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  periodDays: number | null;
  topListings: Array<{
    id: string;
    title: string;
    views: string | number | null;
    clicks: string | number | null;
    saves: string | number | null;
    ctr: string | number | null;
  }>;
  productPerformance: Array<{
    id: string;
    title: string;
    impressions: string | number | null;
    views: string | number | null;
    clicks: string | number | null;
    saves: string | number | null;
    chats: string | number | null;
    shares: string | number | null;
    whatsappClicks: string | number | null;
    ctr: string | number | null;
  }>;
};

const ALIASES: Record<MetricKey, string[]> = {
  liveListings: ["live_listings", "active_listings", "live_listing_count"],
  totalViews: ["total_views", "all_time_views"],
  totalClicks: ["total_clicks", "all_time_clicks"],
  totalSaves: ["total_saves", "total_favorites", "all_time_saves", "favorites"],
  ctr: ["ctr", "click_through_rate"],
  activeTopAds: ["active_top_ads", "top_ads_active"],
  views: ["views", "view_count"],
  impressions: ["impressions", "impression_count"],
  saves: ["saves", "save_count", "favorites"],
  chats: ["chats", "chat_count", "inquiries"],
  whatsappClicks: ["whatsapp_clicks", "whatsapp_click_count", "whatsapp"],
  phoneClicks: ["phone_clicks", "phone_click_count", "phone"],
  shares: ["shares", "share_count", "share"],
};

function asRow(value: unknown): Row | null {
  if (Array.isArray(value)) return asRow(value[0]);
  return value && typeof value === "object" ? (value as Row) : null;
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
  const recent =
    asRow(root.recent_metrics) ??
    asRow(root.events_last_period) ??
    asRow(root.last_30_days) ??
    asRow(root.recent) ??
    asRow(root.events) ??
    {};
  const metrics: AnalyticsPayload["metrics"] = {};

  for (const key of [
    "liveListings",
    "totalViews",
    "totalClicks",
    "totalSaves",
    "ctr",
    "activeTopAds",
  ] as const) {
    const found = firstMetric([summary, root], ALIASES[key]);
    if (found !== undefined) metrics[key] = found;
  }
  for (const key of [
    "views",
    "impressions",
    "saves",
    "chats",
    "whatsappClicks",
    "phoneClicks",
    "shares",
  ] as const) {
    const found = firstMetric([recent, root], ALIASES[key]);
    if (found !== undefined) metrics[key] = found;
  }

  const candidateListings =
    root.top_performing_listings ?? root.top_listings ?? root.listings ?? [];
  const normalizeListing = (item: unknown, index: number) => {
    const row = asRow(item) ?? {};
    const metric = (keys: string[]) => {
      const value = firstMetric([row], keys);
      return value === undefined ? null : value;
    };
    return {
      id:
        typeof row.id === "string"
          ? row.id
          : typeof row.listing_id === "string"
            ? row.listing_id
            : "listing-" + index,
      title:
        typeof row.title === "string"
          ? row.title
          : typeof row.listing_title === "string"
            ? row.listing_title
            : "Listing",
      views: metric([
        "views_during_period",
        "views_last_period",
        "period_views",
        "views",
        "total_views",
        "view_count",
      ]),
      clicks: metric([
        "clicks_during_period",
        "clicks_last_period",
        "clicks",
        "total_clicks",
        "click_count",
      ]),
      saves: metric([
        "saves_during_period",
        "saves_last_period",
        "saves",
        "total_saves",
        "favorites",
        "save_count",
      ]),
      ctr: metric(["ctr", "click_through_rate"]),
    };
  };
  const topListings = (Array.isArray(candidateListings) ? candidateListings : []).map(
    normalizeListing,
  );
  const performanceRows = root.product_performance ?? root.products_performance ?? [];
  const productPerformance = (Array.isArray(performanceRows) ? performanceRows : []).map(
    (item, index) => {
      const row = asRow(item) ?? {};
      const metric = (keys: string[]) => {
        const value = firstMetric([row], keys);
        return value === undefined ? null : value;
      };
      return {
        id:
          typeof row.id === "string"
            ? row.id
            : typeof row.listing_id === "string"
              ? row.listing_id
              : "product-" + index,
        title:
          typeof row.title === "string"
            ? row.title
            : typeof row.listing_title === "string"
              ? row.listing_title
              : "Listing",
        impressions: metric(["impressions", "impression_count"]),
        views: metric([
          "views_during_period",
          "views_last_period",
          "period_views",
          "views",
          "total_views",
          "view_count",
        ]),
        clicks: metric([
          "clicks_during_period",
          "clicks_last_period",
          "clicks",
          "total_clicks",
          "click_count",
        ]),
        saves: metric([
          "saves_during_period",
          "saves_last_period",
          "saves",
          "total_saves",
          "favorites",
          "save_count",
        ]),
        chats: metric(["chats", "chat_count", "inquiries"]),
        shares: metric(["shares", "share_count"]),
        whatsappClicks: metric(["whatsapp_clicks", "whatsapp_activity", "whatsapp_click_count"]),
        ctr: metric(["ctr", "click_through_rate"]),
      };
    },
  );
  const period = firstMetric([root], ["period_days", "days"]);
  return {
    metrics,
    topListings,
    productPerformance,
    periodDays:
      typeof period === "number"
        ? period
        : typeof period === "string" && Number.isFinite(Number(period))
          ? Number(period)
          : null,
  };
}

function formatted(value: string | number | null | undefined, suffix = ""): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return value.toLocaleString() + suffix;
  return suffix && value.endsWith(suffix) ? value : value + suffix;
}

function numericValue(value: string | number | null): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
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
  advancedAnalytics = false,
  entitlementsLoading = false,
  className,
}: {
  userId: string;
  analyticsLevel?: string | null;
  advancedAnalytics?: boolean;
  entitlementsLoading?: boolean;
  className?: string;
}) {
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(30);
  const enabled = hasVendorAnalytics(analyticsLevel);
  const query = useQuery({
    queryKey: ["vendor-analytics", userId, periodDays],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("get_vendor_analytics", { _days: periodDays });
      if (error) throw error;
      return normalizeAnalytics(data);
    },
  });
  const mostViewedProduct =
    query.data?.productPerformance.reduce<{
      title: string;
      views: number;
    } | null>((best, listing) => {
      const views = numericValue(listing.views);
      if (views === null || (best && views <= best.views)) return best;
      return { title: listing.title, views };
    }, null) ?? null;

  return (
    <Card
      id="vendor-analytics"
      className={
        "overflow-hidden p-5 sm:p-6 " +
        (className ??
          "border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] text-slate-100")
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            Merchant insights
          </p>
          <h3 className="mt-1 flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="h-5 w-5 text-emerald-300" />
            {advancedAnalytics ? "Product Performance" : "Basic Analytics"}
          </h3>
        </div>
        {advancedAnalytics ? (
          <Select
            value={String(periodDays)}
            onValueChange={(value) => setPeriodDays(Number(value) as 7 | 30 | 90)}
          >
            <SelectTrigger
              aria-label="Analytics period"
              className="w-full border-white/10 bg-[#07170f] text-slate-100 sm:w-40"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <span className="w-fit rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
            Last 30 days
          </span>
        )}
      </div>

      {entitlementsLoading && (
        <div
          className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6"
          aria-label="Checking analytics access"
        >
          {SUMMARY.map(({ key, label }) => (
            <div
              key={key}
              className="min-h-[76px] animate-pulse rounded-xl border border-white/[0.07] bg-white/[0.03] p-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </p>
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
      {!entitlementsLoading && enabled && query.isLoading && (
        <p className="py-10 text-center text-sm text-slate-400">Loading your analytics…</p>
      )}
      {!entitlementsLoading && enabled && query.isError && (
        <div className="mt-5 rounded-xl border border-rose-300/15 bg-rose-300/[0.05] p-4 text-sm text-slate-300">
          <p>Analytics couldn't be loaded right now.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-white/15 bg-transparent"
            onClick={() => void query.refetch()}
          >
            Try again
          </Button>
        </div>
      )}
      {!entitlementsLoading && enabled && query.data && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {SUMMARY.map(({ key, label, icon: Icon }) => (
              <div
                key={key}
                className="min-w-0 rounded-xl border border-white/[0.07] bg-[#07170f]/75 p-3 sm:p-3.5"
              >
                <div className="flex items-center gap-2 text-slate-500">
                  <Icon className="h-4 w-4 shrink-0 text-emerald-300/80" />
                  <span className="truncate text-[10px] font-semibold uppercase tracking-wide">
                    {label}
                  </span>
                </div>
                <p className="mt-2 truncate text-lg font-bold text-slate-100">
                  {formatted(query.data.metrics[key], key === "ctr" ? "%" : "")}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-200">Recent activity</h4>
              <span className="text-[11px] text-slate-500">
                Last {query.data.periodDays ?? periodDays} days
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {RECENT.map(({ key, label, icon: Icon }) => (
                <div
                  key={key}
                  className="flex min-w-0 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                >
                  <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                  <div className="min-w-0">
                    <p className="truncate text-[10px] text-slate-500">{label}</p>
                    <p className="truncate text-sm font-semibold">
                      {formatted(query.data.metrics[key])}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {advancedAnalytics && (
            <div className="mt-5 border-t border-white/[0.07] pt-4">
              <h4 className="text-sm font-semibold text-slate-200">Product performance</h4>
              {query.data.productPerformance.length > 0 ? (
                <div className="mt-3 overflow-x-auto rounded-xl border border-white/[0.07]">
                  {mostViewedProduct && (
                    <p className="border-b border-white/[0.07] bg-emerald-300/[0.04] px-3 py-2.5 text-xs text-emerald-100">
                      Most viewed among returned products this period:{" "}
                      <span className="font-semibold">{mostViewedProduct.title}</span> (
                      {formatted(mostViewedProduct.views)} views).
                    </p>
                  )}
                  <table className="w-full min-w-[780px] text-left text-xs">
                    <thead className="bg-white/[0.035] text-[10px] uppercase tracking-wide text-slate-500">
                      <tr>
                        {[
                          "Listing",
                          "Impressions",
                          "Period views",
                          "Clicks",
                          "Saves",
                          "Chats",
                          "Shares",
                          "WhatsApp",
                          "CTR",
                        ].map((label) => (
                          <th key={label} className="px-3 py-2.5 font-semibold">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {query.data.productPerformance.map((listing) => (
                        <tr key={listing.id} className="text-slate-300">
                          <td className="max-w-[220px] truncate px-3 py-3 font-medium text-slate-100">
                            {listing.title}
                          </td>
                          <td className="px-3 py-3">{formatted(listing.impressions)}</td>
                          <td className="px-3 py-3">{formatted(listing.views)}</td>
                          <td className="px-3 py-3">{formatted(listing.clicks)}</td>
                          <td className="px-3 py-3">{formatted(listing.saves)}</td>
                          <td className="px-3 py-3">{formatted(listing.chats)}</td>
                          <td className="px-3 py-3">{formatted(listing.shares)}</td>
                          <td className="px-3 py-3">{formatted(listing.whatsappClicks)}</td>
                          <td className="px-3 py-3">
                            {formatted(listing.ctr, listing.ctr === null ? "" : "%")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : query.data.topListings.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {query.data.topListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="grid gap-2 rounded-xl border border-white/[0.06] bg-[#07170f]/60 p-3 sm:grid-cols-[minmax(0,1fr)_repeat(4,minmax(60px,auto))] sm:items-center"
                    >
                      <p className="truncate text-sm font-medium text-slate-200">{listing.title}</p>
                      <span className="text-xs text-slate-400">
                        Views {formatted(listing.views)}
                      </span>
                      <span className="text-xs text-slate-400">
                        Clicks {formatted(listing.clicks)}
                      </span>
                      <span className="text-xs text-slate-400">
                        Saves {formatted(listing.saves)}
                      </span>
                      <span className="text-xs text-slate-400">
                        CTR {formatted(listing.ctr, listing.ctr === null ? "" : "%")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
                  No product performance rows were returned for this period.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
