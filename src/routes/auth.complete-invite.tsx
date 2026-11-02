import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { resetPasswordSchema } from "@/lib/auth-schemas";
import { scorePassword, PasswordStrength } from "@/components/auth/password-strength";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type FormValues = z.infer<typeof resetPasswordSchema>;
export const Route = createFileRoute("/auth/complete-invite")({ component: CompleteInvite });

function CompleteInvite() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(resetPasswordSchema), mode: "onChange", defaultValues: { password: "", confirm_password: "" } });
  useEffect(() => {
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && session && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "PASSWORD_RECOVERY")) setReady(true);
    });
    void supabase.auth.getSession().then(({ data, error }) => { if (active) setReady(!error && !!data.session); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  const submit = async (values: FormValues) => {
    if (scorePassword(values.password).score < 3) { form.setError("password", { message: "Choose a stronger password before continuing." }); return; }
    setBusy(true); const { error } = await supabase.auth.updateUser({ password: values.password }); setBusy(false);
    if (error) { toast.error(error.message || "This activation link is invalid or expired."); return; }
    setComplete(true); toast.success("Your Tile account is active. You can now sign in.");
    window.setTimeout(() => { void nav({ to: "/login" }); }, 1800);
  };
  return <AuthLayout title="Activate your Tile account" description="Choose a secure password to finish setting up your account." backTo="/login" backLabel="Back to sign in" compact>
    {complete ? <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">Your account is active. Redirecting you to sign in…</p> : !ready ? <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">This activation link is invalid, expired, or already used. Contact Tile Support for a new activation link.</div> : <form onSubmit={form.handleSubmit(submit)} className="mt-5 space-y-4"><div className="space-y-2"><Label htmlFor="password">Create password</Label><Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />{form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}<PasswordStrength password={form.watch("password")} /></div><div className="space-y-2"><Label htmlFor="confirm_password">Confirm password</Label><Input id="confirm_password" type="password" autoComplete="new-password" {...form.register("confirm_password")} />{form.formState.errors.confirm_password && <p className="text-sm text-destructive">{form.formState.errors.confirm_password.message}</p>}</div><Button className="w-full" disabled={busy || !form.formState.isValid}>{busy ? "Activating…" : "Set password and activate account"}</Button></form>}
  </AuthLayout>;
}
