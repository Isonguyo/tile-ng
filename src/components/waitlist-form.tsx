import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LOCATIONS } from "@/lib/categories";
import type { FormContent, ReferralCheck, WaitlistFormValues } from "@/lib/waitlist-utils";

const USER_TYPES = [
  { v: "buyer" as const, l: "Individual Buyer" },
  { v: "seller" as const, l: "Materials Vendor" },
  { v: "artisan" as const, l: "Service Artisan" },
  { v: "all" as const, l: "All of the above" },
];

type WaitlistFormProps = {
  form: WaitlistFormValues;
  errors: Record<string, string>;
  referral: ReferralCheck;
  formContent: FormContent;
  pending: boolean;
  onChange: (key: keyof WaitlistFormValues, value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
};

export function WaitlistForm({
  form,
  errors,
  referral,
  formContent,
  pending,
  onChange,
  onSubmit,
}: WaitlistFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <fieldset disabled={pending} className="space-y-5">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{formContent.title ?? "Join the waitlist"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{formContent.subtitle ?? "Join free. Lock your position. Get a founding-member reward at launch."}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={form.full_name}
              maxLength={120}
              onChange={(e) => onChange("full_name", e.target.value)}
              placeholder="Chidi Okafor"
            />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              maxLength={255}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="phone"
              value={form.phone}
              maxLength={30}
              onChange={(e) => onChange("phone", e.target.value)}
              placeholder="0803 000 0000"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Select value={form.state} onValueChange={(value) => onChange("state", value)}>
              <SelectTrigger><SelectValue placeholder="Select your state" /></SelectTrigger>
              <SelectContent className="max-h-64">
                {LOCATIONS.map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={form.city}
              maxLength={60}
              onChange={(e) => onChange("city", e.target.value)}
              placeholder="Ikeja"
            />
            {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="referral">Referral code <span className="text-muted-foreground">(optional)</span></Label>
            {referral.state === "valid" && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
                {referral.referrerName
                  ? `${referral.referrerName} invited you. Your signup will be credited to them.`
                  : "Referral confirmed. Your signup will be credited to the person who invited you."}
              </div>
            )}
            <Input
              id="referral"
              value={form.referral_code}
              maxLength={40}
              onChange={(e) => onChange("referral_code", e.target.value.toUpperCase())}
              placeholder="TLXXXXXXXX"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
            {referral.state === "checking" && (
              <p className="text-xs text-muted-foreground">Checking this referral code…</p>
            )}
            {referral.state === "invalid" && (
              <p className="text-xs text-amber-600 dark:text-amber-500">
                Referral code not recognized. You can still join the waitlist.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>I'm joining as</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {USER_TYPES.map((option) => (
              <button
                key={option.v}
                type="button"
                onClick={() => onChange("user_type", option.v)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${form.user_type === option.v
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted"
                }`}
              >
                {option.l}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={pending} aria-busy={pending}>
          {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining…</> : (formContent.submit ?? "Join the Waitlist")}
        </Button>

        <p className="text-center text-xs leading-5 text-muted-foreground">
          Joining the wait-list is free. After joining, you can create a Tile account
          and prepare your products, shop or artisan profile privately before launch.
        </p>
      </fieldset>
    </form>
  );
}
