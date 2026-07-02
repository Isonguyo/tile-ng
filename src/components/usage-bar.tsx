import { Progress } from "@/components/ui/progress";

export function UsageBar({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const tone =
    pct >= 100 ? "text-red-400" : pct >= 80 ? "text-amber-400" : "text-muted-foreground";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className={`font-mono ${tone}`}>
          {used} / {limit >= 999 ? "∞" : limit}
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}