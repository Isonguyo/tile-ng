import { Progress } from "@/components/ui/progress";

export function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const tone =
    pct >= 100
      ? "text-red-400 font-semibold"
      : pct >= 80
        ? "text-amber-400 font-semibold"
        : "text-slate-400";

  return (
    <div className="space-y-2 rounded-xl border border-[#163321] bg-[#081810]/80 backdrop-blur-md p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-200">{label}</span>
        <span className={`font-mono text-[11px] ${tone}`}>
          {used} / {limit >= 999 ? "∞" : limit}
        </span>
      </div>
      <div className="relative overflow-hidden rounded-full bg-[#05100B] p-0.5 border border-[#163321]">
        <Progress
          value={pct}
          className="h-1.5 bg-transparent [&>div]:bg-[#22C55E] [&>div]:shadow-[0_0_8px_rgba(34,197,94,0.6)] [&>div]:transition-all [&>div]:duration-500"
        />
      </div>
    </div>
  );
}
