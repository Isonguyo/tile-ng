import { z } from "zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/auth-errors";
import { PasswordStrength, scorePassword } from "@/components/auth/password-strength";
import { resetPasswordSchema } from "@/lib/auth-schemas";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Set a new password — Tile" }],
    links: [
      {
        rel: "icon",
        href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg",
      },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: { password: "", confirm_password: "" },
  });

  const password = watch("password");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (values: ResetPasswordFormValues) => {
    const strength = scorePassword(values.password);
    if (strength.score < 3) {
      setError("password", {
        type: "validate",
        message: "Choose a stronger password before continuing.",
      });
      toast.error("Choose a stronger password before continuing.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    setBusy(false);
    if (error) {
      toast.error(
        friendlyAuthError(error.message, "We couldn't update your password. Please try again."),
      );
      return;
    }
    toast.success("Password updated successfully.");
    nav({ to: "/login" });
  };

  return (
    <AuthLayout
      title="Set a new password"
      description="Protect your Tile account with a strong password you can remember."
      backTo="/login"
      backLabel="Back to sign in"
      compact
    >
      {!ready ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700">
          Open this page from the secure reset link in your email so we can update your password
          safely.
        </div>
      ) : null}

      <form
        ref={formRef}
        onSubmit={handleSubmit(submit, onInvalid)}
        className="mt-6 space-y-4"
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              className="pl-9 pr-10"
              {...register("password")}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-2.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          ) : null}
          <PasswordStrength password={password} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirm_password"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirm_password)}
              className="pl-9 pr-10"
              {...register("confirm_password")}
            />
            <button
              type="button"
              aria-label={showConfirm ? "Hide confirmation password" : "Show confirmation password"}
              onClick={() => setShowConfirm((value) => !value)}
              className="absolute right-3 top-2.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirm_password ? (
            <p className="text-sm text-red-600">{errors.confirm_password.message}</p>
          ) : null}
        </div>

        <Button type="submit" disabled={busy || !ready || !isValid} className="w-full">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {busy ? "Updating password…" : "Update password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
