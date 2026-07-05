import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type Health = {
  score: number;
  verified: boolean;
  kyc_done: boolean;
  has_avatar: boolean;
  has_bio: boolean;
  has_shop: boolean;
  profile_complete: boolean;
  active_listings: number;
  avg_rating: number;
  recommendations: string[];
};

export function useMerchantHealth() {
  const { user } = useAuth();
  return useQuery<Health | null>({
    queryKey: ["merchant-health", user?.id ?? "anon"],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("merchant_health_score");
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as unknown as Health) ?? null;
    },
  });
}

function tone(score: number) {
  if (score >= 80) return { ring: "text-emerald-500", label: "Excellent" };
  if (score >= 60) return { ring: "text-primary", label: "Good" };
  if (score >= 40) return { ring: "text-amber-500", label: "Fair" };
  return { ring: "text-red-500", label: "Needs work" };
}

export function MerchantHealthCard({ compact = false }: { compact?: boolean }) {
  const { data, isLoading } = useMerchantHealth();
  if (isLoading || !data) return null;
  const { ring, label } = tone(data.score);
  const pct = Math.max(0, Math.min(100, data.score));
  const circumference = 2 * Math.PI * 26;
  const dash = (pct / 100) * circumference;

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
            <circle cx="32" cy="32" r="26" strokeWidth="6" className="stroke-muted" fill="none" />
            <circle
              cx="32" cy="32" r="26" strokeWidth="6" fill="none" strokeLinecap="round"
              className={ring}
              stroke="currentColor"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-sm font-bold">{pct}</div>
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-sm font-semibold"><Activity className="h-4 w-4 text-primary" /> Merchant health</p>
          <p className="text-xs text-muted-foreground">{label} · {data.active_listings} active listings</p>
        </div>
      </div>

      {!compact && data.recommendations && data.recommendations.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          {data.recommendations.slice(0, 3).map((r, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function QuotaBar({ used, max, label }: { used: number; max: number; label: string }) {
  const safeMax = Math.max(max, 0);
  const pct = safeMax === 0 ? 0 : Math.min(100, Math.round((used / safeMax) * 100));
  const tone = pct >= 100 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="rounded-xl border bg-background/60 p-3">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{used} of {safeMax} used</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${tone} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      {pct >= 100 && <p className="mt-1 text-xs text-red-600">Quota reached — upgrade to publish more.</p>}
    </div>
  );
}