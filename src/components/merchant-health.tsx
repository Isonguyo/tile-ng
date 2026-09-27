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
  if (score >= 80) return { ring: "text-[#22C55E]", label: "Excellent" };
  if (score >= 60) return { ring: "text-emerald-400", label: "Good" };
  if (score >= 40) return { ring: "text-amber-400", label: "Fair" };
  return { ring: "text-red-400", label: "Needs work" };
}

export function MerchantHealthCard({ compact = false }: { compact?: boolean }) {
  const { data, isLoading } = useMerchantHealth();
  if (isLoading || !data) return null;
  const { ring, label } = tone(data.score);
  const pct = Math.max(0, Math.min(100, data.score));
  const circumference = 2 * Math.PI * 26;
  const dash = (pct / 100) * circumference;

  return (
    <div className="rounded-2xl border border-[#163321] bg-[#081810]/80 backdrop-blur-xl p-4 shadow-xl shadow-black/40 relative overflow-hidden">
      {/* Subtle top glow line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#22C55E]/30 to-transparent" />

      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
            <circle 
              cx="32" 
              cy="32" 
              r="26" 
              strokeWidth="6" 
              className="stroke-[#163321]" 
              fill="none" 
            />
            <circle
              cx="32" 
              cy="32" 
              r="26" 
              strokeWidth="6" 
              fill="none" 
              strokeLinecap="round"
              className={`${ring} transition-all duration-700 ease-out`}
              stroke="currentColor"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-sm font-bold text-slate-100">
            {pct}%
          </div>
        </div>

        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-100">
            <Activity className="h-4 w-4 text-[#22C55E]" /> 
            Merchant health
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            <span className="text-[#22C55E] font-medium">{label}</span> · {data.active_listings} active listings
          </p>
        </div>
      </div>

      {!compact && data.recommendations && data.recommendations.length > 0 && (
        <ul className="mt-4 pt-3 border-t border-[#163321] space-y-2 text-xs text-slate-300">
          {data.recommendations.slice(0, 3).map((r, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#22C55E]" /> 
              <span className="leading-tight">{r}</span>
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
  const tone = pct >= 100 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : pct >= 75 ? "bg-amber-500" : "bg-[#22C55E] shadow-[0_0_10px_rgba(34,197,94,0.4)]";

  return (
    <div className="rounded-xl border border-[#163321] bg-[#081810]/80 backdrop-blur-md p-3.5">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200 font-mono">{used} of {safeMax} used</span>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#05100B] border border-[#163321]">
        <div className={`h-full ${tone} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      {pct >= 100 && (
        <p className="mt-2 text-[11px] text-red-400 font-medium flex items-center gap-1">
          Quota reached — upgrade to publish more.
        </p>
      )}
    </div>
  );
}