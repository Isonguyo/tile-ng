import { z } from "zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldErrors } from "react-hook-form";
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
import { focusFormField } from "@/lib/form-navigation";

type LoginFormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ next: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — Tile" },
      {
        name: "description",
        content: "Sign in to your Tile account to manage your shop, listings and messages.",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { next } = Route.useSearch();
  const { user, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const continueAfterLogin = useCallback(() => {
    if (next) {
      try {
        const destination = new URL(next, window.location.origin);
        const token = destination.searchParams.get("token");
        if (
          destination.origin === window.location.origin &&
          destination.pathname === "/staff/accept" &&
          token
        ) {
          nav({ to: "/staff/accept", search: { token } });
          return;
        }
      } catch {
        // Malformed return URLs fall back to the dashboard.
      }
    }
    nav({ to: "/dashboard" });
  }, [nav, next]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!loading && user) continueAfterLogin();
  }, [continueAfterLogin, loading, user]);

  const onSubmit = async (values: LoginFormValues) => {
    if (busy) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    setBusy(false);
    if (error) {
      toast.error(
        friendlyAuthError(
          error.message,
          "We couldn't sign you in. Please check your details and try again.",
        ),
      );
      return;
    }
    toast.success("Welcome back to Tile");
    continueAfterLogin();
  };

  const onInvalid = (invalid: FieldErrors<LoginFormValues>) => {
    const first = Object.keys(invalid)[0] as keyof LoginFormValues | undefined;
    if (!first) return;
    toast.error(invalid[first]?.message ?? "Please complete the required sign-in fields.");
    focusFormField(formRef.current, first);
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to continue managing your listings, messages, and profile on Tile."
      backTo="/"
      backLabel="Back home"
    >
      <div className="mb-6 text-center">
        <p className="text-sm text-muted-foreground">Access your trusted marketplace workspace</p>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        className="space-y-4"
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="email">
            Email address <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              className="pl-9"
              {...register("email")}
            />
          </div>
          {errors.email ? (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              We’ll keep your account secure with Supabase auth.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">
              Password <span className="text-destructive">*</span>
            </Label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              className="pl-9 pr-10"
              {...register("password")}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-2.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={busy}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <OAuthButtons disabled={busy} />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Tile?{" "}
        <Link to="/signup" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
