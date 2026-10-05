import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";

export function TierBadge({ tier }: { tier?: string | null }) {
  if (!tier || tier === "free") return null;

  const style =
    tier === "vip"
      ? "bg-amber-400 text-black border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.4)]"
      : tier === "pro"
        ? "bg-violet-500 text-white border-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.4)]"
        : "bg-[#22C55E] text-[#05100B] border-[#22C55E] shadow-[0_0_10px_rgba(34,197,94,0.4)]";

  return (
    <Badge
      className={`${style} uppercase gap-1 font-bold text-[10px] px-2 py-0.5 rounded-md border-none`}
    >
      <Award className="h-3 w-3 stroke-[2.5]" />
      {tier}
    </Badge>
  );
}
