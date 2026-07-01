import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { MailCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/verify-email")({
  head: () => ({ meta: [{ title: "Verify your email — Tile" }] }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { user } = useAuth();
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = async () => {
    if (!user?.email) return toast.error("No email on file — sign in again");
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: user.email });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Verification email sent");
    setCooldown(60);
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md p-8 border shadow-2xl text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 grid place-items-center mx-auto">
          <MailCheck className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mt-4">Verify your email</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {user?.email
            ? <>We sent a confirmation link to <span className="font-mono">{user.email}</span>. Click it to activate your account.</>
            : <>Check your inbox for the confirmation link we sent when you signed up.</>}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={resend} disabled={busy || cooldown > 0}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
          </Button>
          <Button asChild variant="ghost">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}