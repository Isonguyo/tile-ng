import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";

export function TierBadge({ tier }: { tier?: string | null }) {
  if (!tier || tier === "free") return null;
  const color =
    tier === "vip" ? "bg-amber-500 text-black" :
    tier === "pro" ? "bg-violet-500 text-white" :
    "bg-emerald-500 text-white";
  return <Badge className={`${color} uppercase gap-1`}><Award className="h-3 w-3" />{tier}</Badge>;
}