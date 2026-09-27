import { Loader2 } from "lucide-react";

export function LoadingSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
      <div className="relative flex items-center justify-center">
        {/* Glow backdrop behind the spinner */}
        <div className="absolute h-6 w-6 rounded-full bg-[#22C55E]/20 blur-md animate-pulse" />
        <Loader2 className="h-8 w-8 animate-spin text-[#22C55E] relative z-10" />
      </div>
      <p className="text-sm font-medium text-slate-300 tracking-wide">{label}</p>
    </div>
  );
}