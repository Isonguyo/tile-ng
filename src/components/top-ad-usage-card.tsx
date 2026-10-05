import { useQuery } from "@tanstack/react-query";
import { CalendarClock, LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isTopAdsEntitled } from "@/hooks/use-tile-entitlements";
import { rpcUntyped } from "@/lib/waitlist-rpc";

type Usage = {
  mode: string | null;
  limit: number | null;
  used: number | null;
  remaining: number | null;
  windowStart: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return asRecord(value[0]);
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeUsage(value: unknown): Usage | null {
  const root = asRecord(value);
  if (!root) return null;
  const row = asRecord(root.status) ?? asRecord(root.usage) ?? root;
  return {
    mode: typeof row.mode === "string" ? row.mode : null,
    limit: numberOrNull(row.limit),
    used: numberOrNull(row.used),
    remaining: numberOrNull(row.remaining),
    windowStart: typeof row.window_start === "string" ? row.window_start : null,
  };
}

function nextAvailableDate(usage: Usage): Date | null {
  if (
    usage.mode !== "per_7_days" ||
    usage.used === null ||
    usage.limit === null ||
    usage.used < usage.limit ||
    !usage.windowStart
  )
    return null;
  const start = new Date(usage.windowStart);
  if (Number.isNaN(start.getTime())) return null;
  return new Date(start.getTime() + 7 * 86_400_000);
}

export function TopAdUsageCard({
  userId,
  topAds,
  unlimitedPromotions = false,
  entitlementsLoading,
}: {
  userId: string;
  topAds: unknown;
  unlimitedPromotions?: boolean;
  entitlementsLoading: boolean;
}) {
  const entitled = isTopAdsEntitled(topAds);
  const unlimited = unlimitedPromotions || asRecord(topAds)?.mode === "unlimited";
  const query = useQuery({
    queryKey: ["tile-top-ad-status", userId],
    enabled: entitled && !unlimited,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("tile_top_ad_status", { _user_id: userId });
      if (error) throw error;
      return normalizeUsage(data);
    },
  });
  const usage = query.data;
  const next = usage ? nextAvailableDate(usage) : null;
  const days = next ? Math.max(0, Math.ceil((next.getTime() - Date.now()) / 86_400_000)) : null;

  return (
    <Card
      id="top-ads"
      className="overflow-hidden border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] p-5 text-slate-100 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            Promotion allowance
          </p>
          <h3 className="mt-1 flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-emerald-300" />
            Top Ads
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Promote an approved listing to give it extra visibility.
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-300">
          <CalendarClock className="h-5 w-5" />
        </span>
      </div>

      {entitlementsLoading && (
        <p className="mt-4 rounded-xl border border-white/[0.08] bg-black/10 p-4 text-sm text-slate-400">
          Checking Top Ad access…
        </p>
      )}
      {!entitlementsLoading && !entitled && (
        <div className="mt-4 rounded-xl border border-white/[0.08] bg-black/10 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <LockKeyhole className="h-4 w-4 text-slate-400" />
            Top Ads are available with an eligible Tile plan.
          </p>
          <Button
            asChild
            size="sm"
            className="mt-3 rounded-lg bg-[#35d879] text-[#04120a] hover:bg-[#52e98f]"
          >
            <a href="#billing">View plans</a>
          </Button>
        </div>
      )}
      {!entitlementsLoading && entitled && !unlimited && query.isLoading && (
        <p className="mt-5 text-sm text-slate-400">Loading Top Ad usage…</p>
      )}
      {!entitlementsLoading && entitled && !unlimited && query.isError && (
        <div className="mt-4 rounded-xl border border-rose-300/15 bg-rose-300/[0.05] p-4 text-sm text-slate-300">
          <p>Top Ad usage couldn't be loaded.</p>
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
      {!entitlementsLoading && entitled && !unlimited && usage && (
        <div className="mt-5 rounded-xl border border-white/[0.08] bg-[#07170f]/75 p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-300">
                {usage.mode === "per_billing_cycle"
                  ? "Usage this billing cycle"
                  : usage.mode === "per_7_days"
                    ? "Usage this 7-day period"
                    : "Usage in current window"}
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-white">
                {usage.used === null ? "—" : usage.used}
                <span className="ml-1 text-base font-medium text-slate-500">
                  / {usage.limit ?? "—"} used
                </span>
              </p>
            </div>
            <p className="text-sm text-emerald-200">
              {usage.remaining === null ? "—" : usage.remaining + " remaining"}
            </p>
          </div>
          {usage.mode === "per_7_days" && usage.limit !== null && (
            <p className="mt-3 border-t border-white/[0.07] pt-3 text-xs text-slate-400">
              {usage.limit} Top Ad{usage.limit === 1 ? "" : "s"} available every 7 days.
            </p>
          )}
          {usage.mode === "per_billing_cycle" && usage.limit !== null && (
            <p className="mt-3 border-t border-white/[0.07] pt-3 text-xs text-slate-400">
              {usage.limit} Top Ads available per billing cycle.
            </p>
          )}
          {usage.mode === "per_billing_cycle" &&
            usage.limit !== null &&
            usage.used !== null &&
            usage.used >= usage.limit && (
              <p className="mt-2 text-xs font-medium text-amber-200">
                Your {usage.limit} Top Ads for this billing cycle have been used.
              </p>
            )}
          {next && days !== null && (
            <p className="mt-2 text-xs font-medium text-amber-200">
              Next Top Ad available{" "}
              {days === 0 ? "today" : "in " + days + " day" + (days === 1 ? "" : "s")} (
              {next.toLocaleDateString()}).
            </p>
          )}
          {usage.windowStart && (
            <p className="mt-2 text-[10px] text-slate-500">
              Window started {new Date(usage.windowStart).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
      {!entitlementsLoading &&
        entitled &&
        !unlimited &&
        !query.isLoading &&
        !query.isError &&
        !usage && (
          <p className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
            No Top Ad usage data was returned.
          </p>
        )}
      {!entitlementsLoading && entitled && unlimited && (
        <div className="mt-5 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] p-4">
          <p className="text-lg font-semibold text-emerald-100">Unlimited promotions</p>
          <p className="mt-1 text-sm text-slate-400">
            Promote any eligible listing. Each Top Ad runs for 7 days.
          </p>
        </div>
      )}
    </Card>
  );
}
