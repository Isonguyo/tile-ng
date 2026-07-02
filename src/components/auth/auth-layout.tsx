import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
  backTo?: string;
  backLabel?: string;
  compact?: boolean;
  className?: string;
};

const trustPoints = [
  "Secure authentication",
  "Encrypted with Supabase",
  "Trusted by Nigerian businesses",
  "Buyer & seller protection",
];

export function AuthLayout({ title, description, children, backTo = "/login", backLabel = "Back to sign in", compact = false, className }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.16),_transparent_25%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center">
        <div className="w-full lg:max-w-[470px]">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-3 py-2 text-sm font-semibold shadow-sm backdrop-blur">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground">T</div>
            Tile Marketplace
          </Link>

          <div className="mt-6 rounded-[2rem] border border-border/70 bg-background/80 p-6 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" />
              Trusted authentication
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
            <div className="mt-6 space-y-3 text-sm text-foreground/90">
              {trustPoints.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:flex-1">
          <Card className={cn("mx-auto w-full max-w-xl border-border/70 bg-background/85 p-6 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-8", compact && "max-w-lg", className)}>
            {backTo ? (
              <Link to={backTo} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Link>
            ) : null}
            {children}
          </Card>
        </div>
      </div>
    </div>
  );
}
