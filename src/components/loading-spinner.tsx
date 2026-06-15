import { Loader2 } from "lucide-react";

export function LoadingSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
      <p className="text-sm">{label}</p>
    </div>
  );
}