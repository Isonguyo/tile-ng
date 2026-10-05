import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { rpcUntyped } from "@/lib/waitlist-rpc";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/auth-errors";
import { AuthLayout } from "@/components/auth/auth-layout";
import { MailCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type VerificationState = "checking" | "pending" | "verified" | "error";

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [{ title: "Verify your email — Tile" }],
    links: [
      {
        rel: "icon",
        href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg",
      },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [state, setState] = useState<VerificationState>("checking");
  const [email, setEmail] = useState<string | null>(user?.email ?? null);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [waitlistLinked, setWaitlistLinked] = useState(false);

  // Countdown for resend button
  useEffect(() => {
    if (!cooldown) return;

    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  // Check whether the email has been verified
  useEffect(() => {
    let mounted = true;

    const checkVerification = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        const currentUser = session?.user;

        if (currentUser?.email) {
          setEmail(currentUser.email);
        }

        if (currentUser?.email_confirmed_at) {
          setState("verified");
          void linkWaitlistAccount();
          return;
        }

        setState("pending");
      } catch (error) {
        console.error("Email verification check failed:", error);

        if (mounted) {
          setState("error");
        }
      }
    };

    checkVerification();

    // Also listen for the verification callback/session event.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      const currentUser = session?.user;

      if (currentUser?.email) {
        setEmail(currentUser.email);
      }

      if (
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") &&
        currentUser?.email_confirmed_at
      ) {
        setState("verified");
        void linkWaitlistAccount();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const linkWaitlistAccount = async () => {
    if (waitlistLinked) return;

    try {
      const { data, error } = await rpcUntyped("link_my_waitlist_account");

      if (error) {
        console.error("Waitlist account link failed:", error);
        return;
      }

      const linkResult = (data ?? {}) as { status?: string };
      if (linkResult.status === "linked") {
        setWaitlistLinked(true);

        try {
          window.sessionStorage.removeItem("tile_waitlist_context");
        } catch {
          // Ignore storage cleanup failures.
        }

        toast.success("Your wait-list and Tile account are now connected.");
      } else {
        // Direct signups may legitimately return "not_found".
        setWaitlistLinked(true);
      }
    } catch (error) {
      console.error("Waitlist account link failed:", error);
    }
  };

  const resend = async () => {
    if (!email) {
      toast.error("We couldn't find your email address. Please sign up again or contact support.");
      return;
    }

    setBusy(true);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setBusy(false);

    if (error) {
      toast.error(
        friendlyAuthError(
          error.message,
          "We couldn't send the verification email. Please try again.",
        ),
      );
      return;
    }

    toast.success("Verification email sent.");
    setCooldown(60);
  };

  const continueToTile = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (currentUser?.email_confirmed_at) {
      nav({ to: "/dashboard" });
      return;
    }

    toast.error("Please verify your email before continuing.");
  };

  // Checking verification status
  if (state === "checking") {
    return (
      <AuthLayout
        title="Checking your email"
        description="Please wait while we confirm your Tile account."
        backTo="/login"
        backLabel="Back to login"
        compact
      >
        <div className="rounded-2xl border border-border/70 bg-background/70 p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>

          <h2 className="mt-5 text-lg font-semibold">Checking verification status...</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            We're confirming your email with Tile.
          </p>
        </div>
      </AuthLayout>
    );
  }

  // Successfully verified
  if (state === "verified") {
    return (
      <AuthLayout
        title="Email verified!"
        description="Your Tile account has been successfully verified."
        backTo="/"
        backLabel="Back home"
        compact
      >
        <div className="rounded-2xl border border-border/70 bg-background/70 p-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-500/10 text-green-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <h2 className="mt-5 text-xl font-bold">You're verified! 🎉</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {email
              ? `Your email address ${email} has been verified successfully.`
              : "Your email address has been verified successfully."}
          </p>

          <p className="mt-3 text-sm text-muted-foreground">
            Your Tile account is now ready. You can continue to your dashboard and start using Tile.
          </p>

          <p className="mt-3 text-xs text-muted-foreground">
            {waitlistLinked
              ? "Your early-access information has been linked to this account."
              : "We're finishing your account setup…"}
          </p>

          <Button onClick={continueToTile} className="mt-6 w-full">
            Continue to Tile
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // Verification error
  if (state === "error") {
    return (
      <AuthLayout
        title="Verification problem"
        description="We couldn't confirm your email verification status."
        backTo="/login"
        backLabel="Back to login"
        compact
      >
        <div className="rounded-2xl border border-border/70 bg-background/70 p-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-8 w-8" />
          </div>

          <h2 className="mt-5 text-xl font-bold">Something went wrong</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            We couldn't verify your email right now. The link may have expired or there may have
            been a temporary problem.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={resend} disabled={busy || cooldown > 0}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}

              {cooldown > 0 ? `Resend in ${cooldown}s` : "Send another verification email"}
            </Button>

            <Button asChild variant="outline">
              <Link to="/login">Back to login</Link>
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Normal "waiting for email" state
  return (
    <AuthLayout
      title="Verify your email"
      description="We've sent a confirmation link to your inbox so you can secure your Tile account."
      backTo="/login"
      backLabel="Back to login"
      compact
    >
      <div className="rounded-2xl border border-border/70 bg-background/70 p-5 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="h-8 w-8" />
        </div>

        <h2 className="mt-4 text-lg font-semibold">Check your inbox</h2>

        <p className="mt-2 text-sm text-muted-foreground">
          {email ? (
            <>
              We sent a confirmation link to{" "}
              <span className="font-semibold text-foreground">{email}</span>.
            </>
          ) : (
            "Check your inbox for the confirmation link from Tile."
          )}
        </p>

        <p className="mt-3 text-xs text-muted-foreground">
          After clicking the verification link, you'll be brought back here and we'll confirm your
          account automatically.
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
