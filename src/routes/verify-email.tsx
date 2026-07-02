import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/auth-errors";
import { AuthLayout } from "@/components/auth/auth-layout";
import { MailCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/verify-email")({
  head: () => ({ meta: [{ title: "Verify your email — Tile" }] }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!cooldown) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user?.email_confirmed_at) {
        nav({ to: "/dashboard" });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);

  const resend = async () => {
    if (!user?.email) {
      toast.error("No email on file. Sign up again or contact support.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: user.email });
    setBusy(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    toast.success("Verification email sent.");
    setCooldown(60);
  };

  return (
    <AuthLayout title="Verify your email" description="We’ve sent a confirmation link to your inbox so you can secure your Tile account." backTo="/login" backLabel="Back to login" compact>
      <div className="rounded-2xl border border-border/70 bg-background/70 p-5 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="h-8 w-8" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {user?.email ? <>We sent a confirmation link to <span className="font-semibold text-foreground">{user.email}</span>.</> : "Check your inbox for the confirmation link from Tile."}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button onClick={resend} disabled={busy || cooldown > 0} className="w-full sm:w-auto">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/login">Back to login</Link>
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}