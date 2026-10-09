import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { rpcUntyped } from "@/lib/waitlist-rpc";
import { fromUntyped } from "@/lib/db-untyped";
import { useAuth } from "@/lib/auth-context";
import { formatNaira } from "@/lib/categories";
import { showError } from "@/lib/user-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type PaymentRequest = {
  id: string;
  tier: string;
  amount_ngn?: number | null;
  amount?: number | null;
  payment_code?: string | null;
  status: string;
  admin_note?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
  submitted_at?: string | null;
};

export type ManualPaymentSettings = {
  bank_name?: string | null;
  account_name?: string | null;
  account_number?: string | null;
  instructions?: string | null;
  transfer_instructions?: string | null;
  is_enabled?: boolean | null;
  enabled?: boolean | null;
};

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export const STATUS_LABEL: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  pending_review: "Pending admin review",
  pending: "Pending admin review",
  submitted: "Pending admin review",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  expired: "Expired",
};

export function requestAmount(r: PaymentRequest) {
  return Number(r.amount_ngn ?? r.amount ?? 0);
}

function isExpired(r: PaymentRequest) {
  return r.status === "awaiting_payment" && !!r.expires_at && new Date(r.expires_at) < new Date();
}

export function isOpenRequest(r: PaymentRequest) {
  return (r.status === "awaiting_payment" && !isExpired(r)) || ["pending_review", "pending", "submitted"].includes(r.status);
}

export function useManualPaymentSettings() {
  return useQuery<ManualPaymentSettings | null>({
    queryKey: ["manual-payment-settings"],
    queryFn: async () => {
      const { data, error } = await fromUntyped("manual_payment_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function settingsEnabled(s: ManualPaymentSettings | null | undefined) {
  return !!s && (s.is_enabled ?? s.enabled ?? false) === true && !!s.account_number && !!s.bank_name && !!s.account_name;
}

export function useMyPaymentRequests() {
  const { user } = useAuth();
  return useQuery<PaymentRequest[]>({
    queryKey: ["my-subscription-payments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await fromUntyped("subscription_payment_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Bank-transfer checkout + payment history. Never touches subscription fields;
 *  only the admin approval RPC activates a plan. */
export function BankTransferPanel({ selectedTier, onDone }: { selectedTier: "lite" | "pro" | "vip" | null; onDone: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const settings = useManualPaymentSettings();
  const requests = useMyPaymentRequests();
  const [creating, setCreating] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const list = requests.data ?? [];
  const active = list.find(isOpenRequest);
  const awaiting = active?.status === "awaiting_payment" ? active : null;
  const s = settings.data;
  const refresh = () => qc.invalidateQueries({ queryKey: ["my-subscription-payments", user?.id] });

  const createOrder = async () => {
    if (!selectedTier) return;
    setCreating(true);
    const { error } = await rpcUntyped("create_subscription_payment_order", { _tier: selectedTier });
    setCreating(false);
    if (error) return showError(error, "We couldn't create your payment order. Please try again.");
    toast.success("Payment order created. Transfer the exact amount shown.");
    await refresh();
  };

  const submitProof = async () => {
    if (!awaiting || !user) return;
    if (!file) return toast.error("Upload a screenshot of your transfer confirmation.");
    if (!ALLOWED.includes(file.type)) return toast.error("Only PNG, JPG or WebP images are accepted.");
    if (file.size > MAX_BYTES) return toast.error("The screenshot must be 5 MB or smaller.");
    setSubmitting(true);
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: false, contentType: file.type });
    if (up.error) {
      setSubmitting(false);
      return showError(up.error, "We couldn't upload your screenshot. Please try again.");
    }
    const { error } = await rpcUntyped("submit_subscription_payment_proof", {
      _request_id: awaiting.id,
      _proof_path: path,
      _bank_transaction_reference: reference.trim() || null,
    });
    setSubmitting(false);
    if (error) return showError(error, "We couldn't submit your payment proof. Please try again.");
    toast.success("Proof submitted. Awaiting admin review.");
    setFile(null);
    setReference("");
    await refresh();
    onDone();
  };

  const cancel = async (id: string) => {
    const { error } = await fromUntyped("subscription_payment_requests").update({ status: "cancelled" }).eq("id", id).eq("status", "awaiting_payment");
    if (error) {
      const rpc = await rpcUntyped("cancel_subscription_payment_order", { _request_id: id });
      if (rpc.error) return showError(rpc.error, "We couldn't cancel this order.");
    }
    toast.success("Order cancelled.");
    await refresh();
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  return (
    <div className="mt-5 space-y-4 rounded-2xl border border-white/[0.08] bg-[#07170f]/65 p-4 sm:p-5">
      <p className="text-sm font-semibold text-slate-100">Pay by bank transfer</p>

      {settings.isLoading ? (
        <p className="text-xs text-slate-400">Loading payment details…</p>
      ) : !settingsEnabled(s) ? (
        <p className="text-xs text-amber-300">Bank-transfer payments are not open yet. Please check back soon.</p>
      ) : awaiting ? (
        <div className="space-y-3 text-sm">
          <div className="grid gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.05] p-3 text-slate-200 sm:grid-cols-2">
            <p><span className="text-slate-400">Bank:</span> {s!.bank_name}</p>
            <p><span className="text-slate-400">Account name:</span> {s!.account_name}</p>
            <p className="flex items-center gap-2">
              <span className="text-slate-400">Account number:</span> <b>{s!.account_number}</b>
              <button type="button" aria-label="Copy account number" onClick={() => copy(s!.account_number!)} className="text-emerald-300"><Copy className="h-4 w-4" /></button>
            </p>
            <p><span className="text-slate-400">Amount:</span> <b>{formatNaira(requestAmount(awaiting))}</b> ({awaiting.tier.toUpperCase()})</p>
            <p className="flex items-center gap-2">
              <span className="text-slate-400">Payment code:</span> <b>{awaiting.payment_code}</b>
              {awaiting.payment_code && <button type="button" aria-label="Copy payment code" onClick={() => copy(awaiting.payment_code!)} className="text-emerald-300"><Copy className="h-4 w-4" /></button>}
            </p>
            {awaiting.expires_at && <p><span className="text-slate-400">Order expires:</span> {new Date(awaiting.expires_at).toLocaleString()}</p>}
          </div>
          <p className="text-xs text-slate-400">
            {s!.instructions ?? s!.transfer_instructions ?? "Transfer the exact amount and put the payment code in the transfer narration/description."}
          </p>
          <div className="space-y-2">
            <Label htmlFor="proof">Transfer confirmation screenshot (PNG, JPG or WebP, max 5 MB)</Label>
            <Input id="proof" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <Label htmlFor="bankref">Bank transaction reference (optional)</Label>
            <Input id="bankref" value={reference} maxLength={100} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={submitProof} disabled={submitting} className="bg-[#35d879] text-[#04120a] hover:bg-[#52e98f]">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Submit payment proof
            </Button>
            <Button size="sm" variant="outline" onClick={() => cancel(awaiting.id)}>Cancel order</Button>
          </div>
        </div>
      ) : active ? (
        <p className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3 text-sm text-amber-200">
          Awaiting admin review — payment code <b>{active.payment_code}</b>. Your plan activates once an admin confirms the money has arrived. Plan changes are paused until then.
        </p>
      ) : selectedTier ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">You selected <b className="uppercase">{selectedTier}</b>. Create an order to get the bank details and your unique payment code.</p>
          <p className="text-xs text-slate-500">By continuing, I confirm I have reviewed the <Link to="/billing-terms" className="text-emerald-300 underline">Subscription & Billing Terms</Link>.</p>
          <Button size="sm" onClick={createOrder} disabled={creating} className="bg-[#35d879] text-[#04120a] hover:bg-[#52e98f]">
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create payment order
          </Button>
        </div>
      ) : (
        <p className="text-xs text-slate-400">Choose a plan above to start a bank-transfer payment.</p>
      )}

      {list.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-300">Your payment requests</p>
          <ul className="space-y-1.5 text-xs">
            {list.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-white/[0.06] p-2 text-slate-300">
                <span className="font-semibold uppercase">{r.tier}</span>
                <span>{formatNaira(requestAmount(r))}</span>
                <span className="text-slate-500">{r.payment_code}</span>
                <span className="ml-auto">{isExpired(r) ? "Expired — create a new order" : (STATUS_LABEL[r.status] ?? r.status)}</span>
                {r.status === "rejected" && r.admin_note && <span className="w-full text-red-300">Reason: {r.admin_note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
