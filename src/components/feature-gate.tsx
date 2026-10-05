import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePlan, hasCapability, type PlanCapability } from "@/hooks/use-plan";

type Props = {
  capability: PlanCapability;
  requiredTier?: "lite" | "pro" | "vip";
  children: ReactNode;
  fallback?: ReactNode;
  compact?: boolean;
};

export function FeatureGate({
  capability,
  requiredTier = "lite",
  children,
  fallback,
  compact,
}: Props) {
  const { data: plan, isLoading } = usePlan();

  if (isLoading) return null;
  if (hasCapability(plan, capability)) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-amber-400">
        <Lock className="h-3 w-3" />
        <Link to="/dashboard" className="underline">
          Upgrade to {requiredTier.toUpperCase()}
        </Link>
      </div>
    );
  }

  return (
    <Card className="p-5 border-dashed border-amber-500/30 bg-amber-500/5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">
            Available on the {requiredTier.toUpperCase()} plan
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Upgrade your subscription to unlock this feature and grow your business faster.
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link to="/dashboard">View plans</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
