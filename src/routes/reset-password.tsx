import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/auth-errors";
import { PasswordStrength, scorePassword } from "@/components/password-strength";
import { Loader2, Lock } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set a new password — Tile" }] }),
  component: ResetPage,
});

function ResetPage() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase will emit PASSWORD_RECOVERY when the recovery link is clicked.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // If page loaded without event but there is already a session, allow.
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match");
    if (scorePassword(password).score < 2) return toast.error("Choose a stronger password");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(friendlyAuthError(error.message));
    toast.success("Password updated");
    nav({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md p-8 border shadow-2xl">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose something you'll remember.</p>

        {!ready && (
          <p className="mt-6 text-sm text-amber-400">
            Open this page from the reset link in your email.
          </p>
        )}

        <form onSubmit={submit} className="space-y-4 mt-6">
          <div>
            <Label htmlFor="pw">New password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" minLength={8} required />
            </div>
            <div className="mt-2"><PasswordStrength password={password} /></div>
          </div>
          <div>
            <Label htmlFor="cf">Confirm password</Label>
            <Input id="cf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
          </div>
          <Button type="submit" disabled={busy || !ready} className="w-full">
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Update password
          </Button>
        </form>
      </Card>
    </div>
  );
}