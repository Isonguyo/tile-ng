import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/auth-errors";
import { PasswordStrength, scorePassword } from "@/components/password-strength";
import { Loader2, ShoppingBag, Store, Wrench } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your Tile account" },
      { name: "description", content: "Join Nigeria's marketplace. Buy, sell goods, or offer services in minutes." },
    ],
  }),
  component: SignupPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  account_type: z.enum(["buyer", "merchant", "artisan"]),
});

const TYPES: Array<{ value: "buyer" | "merchant" | "artisan"; label: string; hint: string; Icon: typeof ShoppingBag }> = [
  { value: "buyer", label: "Buyer", hint: "Discover and shop from vendors", Icon: ShoppingBag },
  { value: "merchant", label: "Merchant", hint: "Sell goods & open a shop", Icon: Store },
  { value: "artisan", label: "Artisan", hint: "Offer services & book jobs", Icon: Wrench },
];

function SignupPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", account_type: "buyer" as const });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (scorePassword(form.password).score < 2) return toast.error("Choose a stronger password");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
        data: { full_name: form.name, account_type: form.account_type },
      },
    });
    if (!error && data.user) {
      await supabase.from("profiles").update({ full_name: form.name, account_type: form.account_type }).eq("id", data.user.id);
    }
    setBusy(false);
    if (error) return toast.error(friendlyAuthError(error.message));
    if (data.session) {
      toast.success("Account created — welcome to Tile");
      nav({ to: "/dashboard" });
    } else {
      toast.success("Check your email to verify your account");
      nav({ to: "/verify-email" });
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-in failed");
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-lg p-8 border shadow-2xl">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <div className="h-10 w-10 rounded-lg bg-primary grid place-items-center text-primary-foreground font-black">T</div>
          <span className="text-2xl font-bold">Tile</span>
        </Link>
        <h1 className="text-2xl font-bold text-center">Create your account</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">Join Nigeria's fastest-growing marketplace</p>

        <form onSubmit={submit} className="space-y-4 mt-6">
          <div>
            <Label>I am a…</Label>
            <RadioGroup
              value={form.account_type}
              onValueChange={(v) => setForm((f) => ({ ...f, account_type: v as typeof f.account_type }))}
              className="grid grid-cols-3 gap-2 mt-2"
            >
              {TYPES.map(({ value, label, hint, Icon }) => (
                <label
                  key={value}
                  className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${
                    form.account_type === value ? "border-primary bg-primary/5 ring-2 ring-primary" : "hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value={value} className="sr-only" />
                  <Icon className="h-5 w-5 mx-auto text-primary" />
                  <p className="mt-1.5 text-sm font-semibold">{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="name" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="new-password" minLength={8} />
            <div className="mt-2"><PasswordStrength password={form.password} /></div>
          </div>

          <Button type="submit" disabled={busy} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create account
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            By continuing you agree to our Terms and Privacy Policy.
          </p>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
        </div>
        <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>

        <p className="mt-6 text-sm text-center text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}