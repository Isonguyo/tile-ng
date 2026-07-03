import { z } from "zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/auth-errors";
import { loginSchema } from "@/lib/auth-schemas";
import { AuthLayout } from "@/components/auth/auth-layout";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type LoginFormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Tile" },
      { name: "description", content: "Sign in to your Tile account to manage your shop, listings and messages." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const email = watch("email");
  const password = watch("password");

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [loading, nav, user]);

  const onSubmit = async (values: LoginFormValues) => {
    if (busy) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
    setBusy(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    toast.success("Welcome back to Tile");
    nav({ to: "/dashboard" });
  };

  const canSubmit = useMemo(() => Boolean(email && password && isValid), [email, password, isValid]);

  return (
    <AuthLayout title="Welcome back" description="Sign in to continue managing your listings, messages, and profile on Tile." backTo="/" backLabel="Back home">
      <div className="mb-6 text-center">
        <p className="text-sm text-muted-foreground">Access your trusted marketplace workspace</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" autoComplete="email" className="pl-9" {...register("email")} />
          </div>
          {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : <p className="text-xs text-muted-foreground">We’ll keep your account secure with Supabase auth.</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" className="pl-9 pr-10" {...register("password")} />
            <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-2.5 text-muted-foreground transition-colors hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
        </div>

        <Button type="submit" disabled={busy || !canSubmit} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
      </div>

      <OAuthButtons disabled={busy} />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Tile? <Link to="/signup" className="font-semibold text-primary hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  );
}