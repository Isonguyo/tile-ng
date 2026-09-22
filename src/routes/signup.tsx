import { z } from "zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { rpcUntyped } from "@/lib/waitlist-rpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/auth-errors";
import { PasswordStrength, scorePassword } from "@/components/auth/password-strength";
import { AuthLayout } from "@/components/auth/auth-layout";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { EmailVerificationNotice } from "@/components/auth/email-verification-notice";
import { signupSchema, accountTypes, type AccountType } from "@/lib/auth-schemas";
import { Loader2, ShoppingBag, Store, Wrench, Eye, EyeOff, Phone, Briefcase } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { siteUrl } from "@/lib/site-url";

type SignupFormValues = z.infer<typeof signupSchema>;

type WaitlistContext = {
  email?: string;
  user_type?: "buyer" | "seller" | "artisan" | "all";
  account_type?: AccountType;
};

const typeIcons: Record<AccountType, typeof ShoppingBag> = {
  buyer: ShoppingBag,
  merchant: Store,
  artisan: Wrench,
};

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your Tile account" },
      { name: "description", content: "Join Nigeria's marketplace. Buy, sell goods, or offer services in minutes." },
    ],
    links: [
      {
        rel: "icon",
        href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [waitlistContext, setWaitlistContext] = useState<WaitlistContext | null>(null);
  const [fromWaitlist, setFromWaitlist] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
      phone_number: "",
      business_name: "",
      account_type: "buyer",
    },
  });

  const password = watch("password");
  const email = watch("email");
  const accountType = watch("account_type");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const isWaitlistSignup = params.get("from") === "waitlist";

      const raw = window.sessionStorage.getItem("tile_waitlist_context");
      if (!raw) {
        setFromWaitlist(isWaitlistSignup);
        return;
      }

      const parsed = JSON.parse(raw) as WaitlistContext;
      setWaitlistContext(parsed);
      setFromWaitlist(isWaitlistSignup || Boolean(raw));

      if (parsed.email) {
        setValue("email", parsed.email, { shouldValidate: true });
      }

      const mappedType: AccountType | undefined =
        parsed.account_type ??
        (parsed.user_type === "seller"
          ? "merchant"
          : parsed.user_type === "artisan"
            ? "artisan"
            : parsed.user_type === "buyer"
              ? "buyer"
              : undefined);

      if (mappedType) {
        setValue("account_type", mappedType, { shouldValidate: true });
      }
    } catch (error) {
      console.warn("Unable to restore wait-list signup context:", error);
    }
  }, [setValue]);

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [loading, nav, user]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const linkWaitlistIfNeeded = async () => {
    if (!fromWaitlist) return;

    const { error } = await rpcUntyped("link_my_waitlist_account");
    if (error) {
      console.error("Unable to link wait-list account:", error);
      return;
    }

    try {
      window.sessionStorage.removeItem("tile_waitlist_context");
    } catch {
      // Ignore cleanup failures.
    }
  };

  const onSubmit = async (values: SignupFormValues) => {
    if (busy) return;
    const strength = scorePassword(values.password);
    if (strength.score < 3) {
      toast.error("Choose a stronger password before continuing.");
      return;
    }

    setBusy(true);
    const redirectTo = siteUrl("/verify-email");
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: values.full_name,
          account_type: values.account_type,
          phone_number: values.phone_number || null,
          business_name: values.business_name || null,
          from_waitlist: fromWaitlist,
          waitlist_user_type: waitlistContext?.user_type ?? null,
        },
      },
    });

    setBusy(false);

    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }

    if (data.session) {
      await linkWaitlistIfNeeded();
      toast.success(
        fromWaitlist
          ? "Account created. Your early-access setup is ready."
          : "Account created. You’re ready to explore Tile.",
      );
      nav({ to: "/dashboard" });
      return;
    }

    setEmailSent(true);
    toast.success("Account created. Please verify your email to continue.");
  };

  const resendEmail = async () => {
    if (!email) {
      toast.error("Enter your email before requesting another verification link.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setBusy(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    toast.success("Verification email sent.");
    setCooldown(60);
  };

  const canSubmit = useMemo(() => Boolean(watch("full_name") && watch("email") && password && watch("confirm_password") && isValid), [isValid, password, watch]);

  return (
    <AuthLayout title="Create your account" description="Join Tile to buy, sell, and discover trusted goods and services across Nigeria." backTo="/" backLabel="Back home" compact>
      {emailSent ? (
        <EmailVerificationNotice email={email} onResend={resendEmail} busy={busy} cooldown={cooldown} />
      ) : (
        <>
          <div className="mb-6 text-center">
            <p className="text-sm text-muted-foreground">
              {fromWaitlist
                ? "Create your Tile account now and prepare privately for launch."
                : "Build your profile and start trading with confidence"}
            </p>
            {fromWaitlist && (
              <p className="mt-2 text-xs text-primary font-medium">
                Your account is being created as part of Tile's early-access program.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label>I’m signing up as</Label>
              <RadioGroup
                value={accountType}
                onValueChange={(value) => setValue("account_type", value as AccountType)}
                className="grid gap-2 sm:grid-cols-3"
              >
                {accountTypes.map(({ value, label, hint }) => {
                  const Icon = typeIcons[value];
                  return (
                    <label key={value} className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${accountType === value ? "border-primary bg-primary/5 ring-2 ring-primary" : "hover:border-primary/50"}`}>
                      <RadioGroupItem value={value} className="sr-only" />
                      <Icon className="mb-2 h-5 w-5 text-primary" />
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" autoComplete="name" {...register("full_name")} />
              {errors.full_name ? <p className="text-sm text-red-600">{errors.full_name.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone number</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="phone_number" className="pl-9" {...register("phone_number")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_name">Business name</Label>
                <div className="relative">
                  <Briefcase className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="business_name" className="pl-9" {...register("business_name")} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" {...register("password")} />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-2.5 text-muted-foreground transition-colors hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
              <PasswordStrength password={password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm password</Label>
              <div className="relative">
                <Input id="confirm_password" type={showConfirm ? "text" : "password"} autoComplete="new-password" {...register("confirm_password")} />
                <button type="button" aria-label={showConfirm ? "Hide confirmation password" : "Show confirmation password"} onClick={() => setShowConfirm((value) => !value)} className="absolute right-3 top-2.5 text-muted-foreground transition-colors hover:text-foreground">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirm_password ? <p className="text-sm text-red-600">{errors.confirm_password.message}</p> : null}
            </div>

            <Button type="submit" disabled={busy || !canSubmit} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {busy ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
          </div>

          <OAuthButtons disabled={busy} />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}