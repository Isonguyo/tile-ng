import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { rpcUntyped } from "@/lib/waitlist-rpc";
import { useAuth } from "@/lib/auth-context";
import { formatNaira } from "@/lib/categories";
import { showError } from "@/lib/user-feedback";
import { useConfirmAction } from "@/components/confirm-action-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_LABEL, useManualPaymentSettings } from "@/components/billing/bank-transfer-checkout";

type AdminRequest = Record<string, unknown> & { id: string; status: string };

const FILTERS = ["pending_review", "awaiting_payment", "approved", "rejected", "cancelled", "all"] as const;

function str(r: AdminRequest, ...keys: string[]) {
  for (const k of keys) if (r[k] != null && r[k] !== "") return String(r[k]);
  return "";
}

export function useAdminPaymentRequests(status: string) {
  const { isAdmin } = useAuth();
  return useQuery<AdminRequest[]>({
    queryKey: ["admin-subscription-payments", status],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("admin_list_subscription_payment_requests", {
        _status: status === "all" ? null : status,
      });
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as AdminRequest[];
    },
  });
}

function ProofImage({ path }: { path: string }) {
  const { isAdmin } = useAuth();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!isAdmin || !path) return;
    supabase.storage.from("payment-proofs").createSignedUrl(path, 300).then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [isAdmin, path]);
  if (!path) return <p className="text-xs text-muted-foreground">No screenshot submitted.</p>;
  if (!url) return <p className="text-xs text-muted-foreground">Loading screenshot…</p>;
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt="Transfer confirmation" className="max-h-64 rounded-md border border-border object-contain" />
    </a>
  );
}

export function SubscriptionPaymentsPanel() {
  const [status, setStatus] = useState<string>("pending_review");
  const { data = [], isLoading, error } = useAdminPaymentRequests(status);
  const qc = useQueryClient();
  const confirm = useConfirmAction();
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const review = async (r: AdminRequest, decision: "approved" | "rejected", note: string | null) => {
    setBusy(r.id);
    const { error } = await rpcUntyped("admin_review_subscription_payment", {
      _request_id: r.id,
      _decision: decision,
      _admin_note: note,
    });
    setBusy(null);
    if (error) return showError(error, "The review could not be saved.");
    toast.success(decision === "approved" ? "Payment approved — plan activated." : "Payment rejected.");
    setRejecting(null);
    setReason("");
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["admin-subscription-payments"] }),
      qc.invalidateQueries({ queryKey: ["admin-dash"] }),
      qc.invalidateQueries({ queryKey: ["admin-stats"] }),
      qc.invalidateQueries({ queryKey: ["admin-users"] }),
    ]);
  };

  const approve = async (r: AdminRequest) => {
    const ok = await confirm({
      title: "Approve this payment?",
      description: `Only approve after you have confirmed ${formatNaira(Number(str(r, "amount_ngn", "amount") || 0))} actually arrived in the receiving bank account with code ${str(r, "payment_code")}. A screenshot alone is not proof.`,
      confirmLabel: "Approve and activate plan",
    });
    if (ok) await review(r, "approved", null);
  };

  return (
    <div className="space-y-4">
      <Card className="flex gap-3 border-amber-500/30 bg-amber-500/5 p-4 text-sm">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
        <p>Verify the actual credit in the receiving bank account before approving. A screenshot alone is not proof of settlement.</p>
      </Card>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button key={f} size="sm" variant={status === f ? "default" : "outline"} onClick={() => setStatus(f)}>
            {f === "all" ? "All" : (STATUS_LABEL[f] ?? f)}
          </Button>
        ))}
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading payments…</p>
      ) : error ? (
        <p className="text-sm text-destructive">Could not load payments: {(error as Error).message}</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payment requests here.</p>
      ) : (
        data.map((r) => {
          const reviewable = ["pending_review", "pending", "submitted"].includes(r.status);
          return (
            <Card key={r.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{str(r, "full_name", "user_name") || "Unnamed user"} <span className="text-xs text-muted-foreground">{str(r, "email", "user_email")}</span></p>
                  <p className="text-sm">
                    <b className="uppercase">{str(r, "tier", "requested_tier")}</b> · {formatNaira(Number(str(r, "amount_ngn", "amount") || 0))} · code <b>{str(r, "payment_code")}</b>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bank ref: {str(r, "bank_transaction_reference") || "—"} · Submitted: {str(r, "submitted_at", "created_at") ? new Date(str(r, "submitted_at", "created_at")).toLocaleString() : "—"}
                  </p>
                  {str(r, "admin_note") && <p className="text-xs text-muted-foreground">Admin note: {str(r, "admin_note")}</p>}
                </div>
                <span className="rounded-full border border-border px-2 py-1 text-xs">{STATUS_LABEL[r.status] ?? r.status}</span>
              </div>
              <ProofImage path={str(r, "proof_path")} />
              {reviewable && (
                rejecting === r.id ? (
                  <div className="space-y-2">
                    <Label htmlFor={`reason-${r.id}`}>Reason for rejection (shown to the user)</Label>
                    <Textarea id={`reason-${r.id}`} value={reason} onChange={(e) => setReason(e.target.value)} />
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" disabled={!reason.trim() || busy === r.id} onClick={() => review(r, "rejected", reason.trim())}>
                        {busy === r.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm rejection
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRejecting(null)}>Back</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" disabled={busy === r.id} onClick={() => approve(r)}>Approve payment</Button>
                    <Button size="sm" variant="outline" onClick={() => { setRejecting(r.id); setReason(""); }}>Reject payment</Button>
                  </div>
                )
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}

export function ManualPaymentSettingsCard() {
  const { data, isLoading } = useManualPaymentSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState({ bank: "", name: "", number: "", instructions: "", enabled: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm({
      bank: data.bank_name ?? "",
      name: data.account_name ?? "",
      number: data.account_number ?? "",
      instructions: data.instructions ?? data.transfer_instructions ?? "",
      enabled: (data.is_enabled ?? data.enabled ?? false) === true,
    });
  }, [data]);

  const valid = form.bank.trim() && form.name.trim() && /^\d{10}$/.test(form.number.trim());

  const save = async () => {
    if (form.enabled && !valid) return toast.error("Enter a bank name, account name and 10-digit account number before enabling.");
    setSaving(true);
    const { error } = await rpcUntyped("admin_update_manual_payment_settings", {
      _bank_name: form.bank.trim(),
      _account_name: form.name.trim(),
      _account_number: form.number.trim(),
      _instructions: form.instructions.trim() || null,
      _is_enabled: form.enabled,
    });
    setSaving(false);
    if (error) return showError(error, "Settings could not be saved.");
    toast.success("Bank-transfer settings saved.");
    qc.invalidateQueries({ queryKey: ["manual-payment-settings"] });
  };

  return (
    <Card className="space-y-3 p-5">
      <div>
        <h3 className="font-semibold">Bank-transfer payments</h3>
        <p className="text-xs text-muted-foreground">These details are shown to users at checkout. Payments stay off until you save valid details and switch them on.</p>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1"><Label htmlFor="mp-bank">Bank name</Label><Input id="mp-bank" value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="mp-name">Account name</Label><Input id="mp-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="mp-num">Account number</Label><Input id="mp-num" inputMode="numeric" maxLength={10} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value.replace(/\D/g, "") })} /></div>
          </div>
          <div className="space-y-1"><Label htmlFor="mp-ins">Transfer instructions</Label><Textarea id="mp-ins" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} /> Accept bank-transfer payments</label>
          <Button size="sm" onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
        </>
      )}
    </Card>
  );
}
