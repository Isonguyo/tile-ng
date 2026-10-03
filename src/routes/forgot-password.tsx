import { z } from "zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldErrors } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/auth-errors";
import { forgotPasswordSchema } from "@/lib/auth-schemas";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { focusFormField } from "@/lib/form-navigation";

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset your password — Tile" }],
  links: [
      {
        rel: "icon",
        href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg",
      },
    ],
   }),
  component: ForgotPage,
});

function ForgotPage() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: { email: "" },
  });

  const email = watch("email");

  const submit = async (values: ForgotPasswordFormValues) => {
    setBusy(true);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo });
    setBusy(false);
    if (error) {
      toast.error(friendlyAuthError(error.message, "We couldn't send a password reset link. Please try again."));
      return;
    }
    setSent(true);
  };

  const onInvalid = (invalid: FieldErrors<ForgotPasswordFormValues>) => {
    const message = invalid.email?.message;
    toast.error(message ?? "Enter your email address to request a reset link.");
    focusFormField(formRef.current, "email");
  };

  return (
    <AuthLayout title="Forgot password?" description="Enter your email and we’ll send a secure reset link to your inbox." backTo="/login" backLabel="Back to sign in" compact>
      {sent ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-semibold">Check your inbox</p>
              <p className="mt-1 text-sm text-muted-foreground">
                If {email} is registered, we’ve sent a secure reset link.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit(submit, onInvalid)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} className="pl-9" {...register("email")} />
            </div>
            {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : <p className="text-xs text-muted-foreground">We’ll never share your email with third parties.</p>}
          </div>

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {busy ? "Sending reset link…" : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it? <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
