import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type AccessResult = { name: string; email: string; accountType?: string; link: string; phone?: string; mode: "activation" | "recovery" };

export function UserOnboardingPanel() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AccessResult | null>(null);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState("buyer");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [verified, setVerified] = useState(false);

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(""); setResult(null);
    const { data, error: invokeError } = await supabase.functions.invoke("admin-user-access", { body: {
      action: "create_invite", full_name: fullName.trim(), email: email.trim(), phone: phone.trim(),
      account_type: accountType, state: state.trim(), lga: lga.trim(), business_name: businessName.trim(),
    } });
    setBusy(false);
    if (invokeError || data?.error) { setError(data?.error ?? invokeError?.message ?? "Unable to create the account."); return; }
    if (!data?.activation_link) { setError("The function did not return an activation link."); return; }
    setResult({ name: fullName.trim(), email: email.trim(), accountType, link: data.activation_link, phone, mode: "activation" });
  };

  const generateRecovery = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!verified) return;
    setBusy(true); setError(""); setResult(null);
    const { data, error: invokeError } = await supabase.functions.invoke("admin-user-access", { body: { action: "generate_recovery", email: recoveryEmail.trim() } });
    setBusy(false);
    if (invokeError || data?.error) { setError(data?.error ?? invokeError?.message ?? "Unable to generate a recovery link."); return; }
    if (!data?.recovery_link) { setError("The function did not return a recovery link."); return; }
    let fullName = data.full_name as string | undefined;
    let phone = data.phone as string | undefined;
    // The deployed function returns only email and link; look up optional WhatsApp details
    // through the existing admin-only profile inspection RPC.
    if (!fullName || !phone) {
      const { data: users } = await supabase.rpc("admin_list_users");
      const user = (users ?? []).find((item) => item.email?.toLowerCase() === recoveryEmail.trim().toLowerCase());
      if (user?.id) {
        const { data: inspection } = await supabase.rpc("admin_user_inspector", { _uid: user.id });
        const profile = (Array.isArray(inspection) ? inspection[0] : inspection) as { full_name?: string | null; phone?: string | null } | null;
        fullName = fullName ?? profile?.full_name ?? undefined;
        phone = phone ?? profile?.phone ?? undefined;
      }
    }
    setResult({ name: fullName ?? recoveryEmail.trim(), email: recoveryEmail.trim(), link: data.recovery_link, phone: phone ?? "", mode: "recovery" });
  };

  const message = result?.mode === "activation"
    ? `Hello ${result.name},\n\nYour Tile account has been created successfully.\n\nTo activate your account and create your password, open the secure link below:\n\n${result.link}\n\nPlease keep this link private and do not forward it to anyone.\n\nWelcome to Tile.`
    : result ? `Hello ${result.name},\n\nWe have generated a secure password recovery link for your Tile account.\n\nOpen the link below to choose a new password:\n\n${result.link}\n\nPlease keep this link private.` : "";
  const copy = async (value: string) => { await navigator.clipboard.writeText(value); toast.success("Copied to clipboard."); };
  const field = (label: string, value: string, set: (v: string) => void, required = false, type = "text") => <label className="grid gap-1 text-sm">{label}{required ? " *" : ""}<Input type={type} required={required} value={value} onChange={(e) => set(e.target.value)} /></label>;

  return <div className="grid gap-5 xl:grid-cols-2">
    <Card className="space-y-4 p-5"><div><h2 className="text-lg font-bold">Create User</h2><p className="text-sm text-muted-foreground">Create a Tile profile and generate a private activation link.</p></div>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => void createAccount(e)}>
        {field("Full name", fullName, setFullName, true)}{field("Email address", email, setEmail, true, "email")}
        {field("Phone / WhatsApp", phone, setPhone)}
        <label className="grid gap-1 text-sm">Account type<select className="h-10 rounded-md border bg-background px-3" value={accountType} onChange={(e) => setAccountType(e.target.value)}>{["buyer", "merchant", "artisan"].map((v) => <option key={v} value={v}>{v[0].toUpperCase() + v.slice(1)}</option>)}</select></label>
        {field("State", state, setState)}{field("LGA", lga, setLga)}{accountType !== "buyer" && field("Business name", businessName, setBusinessName)}
        <Button className="sm:col-span-2" disabled={busy}>{busy ? "Creating…" : "Create Account & Generate Activation Link"}</Button>
      </form>
    </Card>
    <Card className="space-y-4 p-5"><div><h2 className="text-lg font-bold">Generate Password Recovery Link</h2><p className="text-sm text-muted-foreground">Verify the user's identity before generating a link.</p></div>
      <form className="grid gap-3" onSubmit={(e) => void generateRecovery(e)}>{field("User's registered email", recoveryEmail, setRecoveryEmail, true, "email")}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} /> I confirm this user's identity has been verified.</label>
        <Button disabled={busy || !verified}>{busy ? "Generating…" : "Generate Recovery Link"}</Button>
      </form>
    </Card>
    {error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive xl:col-span-2">{error}{/already (exists|registered|in use)|already_exists|user_already_exists/i.test(error) ? " This email already has an account. After verifying their identity, use Generate Password Recovery Link." : ""}</p>}
    {result && <Card className="space-y-3 border-primary/30 p-5 xl:col-span-2"><div className="flex justify-between"><h3 className="font-bold">{result.mode === "activation" ? "Account created successfully" : "Recovery link ready"}</h3><Button variant="ghost" size="sm" onClick={() => setResult(null)}>Close</Button></div>
      {result.mode === "activation" && <p className="text-sm">Account created successfully. The user must open the activation link and choose their own password before signing in.</p>}
      <p className="text-sm">{result.name} · {result.email} · {result.accountType ?? "Account"}</p><div className="break-all rounded-md bg-muted p-3 text-sm">{result.link}</div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void copy(result.link)}>Copy {result.mode === "activation" ? "Activation" : "Recovery"} Link</Button><Button variant="outline" onClick={() => void copy(message)}>Copy WhatsApp Message</Button>
        {result.phone && <Button asChild variant="outline"><a href={`https://wa.me/${result.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">Open WhatsApp Chat</a></Button>}
      </div>
    </Card>}
  </div>;
}
