import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Bot,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Copy,
  Crown,
  Gauge,
  Globe,
  Info,
  Loader2,
  LockKeyhole,
  Megaphone,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { rpcUntyped } from "@/lib/waitlist-rpc";
import type { MerchantStaffContext } from "@/hooks/use-merchant-staff-context";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return asRecord(value[0]);
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function normalizeStatus(value: unknown): string {
  if (typeof value === "string") return value.toLowerCase();
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;
    const status =
      typeof row.status === "string"
        ? row.status
        : typeof row.state === "string"
          ? row.state
          : "unknown";
    return status.toLowerCase();
  }
  return "unknown";
}

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function VipAnalyticsSection({ enabled }: { enabled: boolean }) {
  const [days, setDays] = useState(30);

  const query = useQuery({
    queryKey: ["vip-analytics", days],
    enabled,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("get_vip_advanced_analytics", { _days: days });
      if (error) throw new Error(error.message);
      return asRecord(data) ?? {};
    },
  });

  if (!enabled) {
    return (
      <Card
        id="vip-analytics"
        className="border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] p-5 text-slate-100 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200">
            <Gauge className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
              VIP Feature
            </p>
            <h3 className="mt-1 text-xl font-semibold text-white">Advanced Analytics</h3>
            <p className="mt-2 text-sm text-slate-400">
              Upgrade to VIP to unlock live dashboard metrics, product performance and detailed
              merchant reporting.
            </p>
            <Button
              asChild
              className="mt-4 rounded-xl bg-[#35d879] text-[#04120a] hover:bg-[#52e98f]"
            >
              <a href="#billing">Upgrade to VIP</a>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const summary: Array<{ label: string; value: string | number }> = [
    { label: "Live Listings", value: toNumber(query.data?.live_listings) },
    { label: "Views", value: toNumber(query.data?.views) },
    { label: "Impressions", value: toNumber(query.data?.impressions) },
    { label: "Saves", value: toNumber(query.data?.saves) },
    { label: "Chats", value: toNumber(query.data?.chats) },
    { label: "WhatsApp Clicks", value: toNumber(query.data?.whatsapp_clicks) },
    { label: "Phone Clicks", value: toNumber(query.data?.phone_clicks) },
    { label: "CTR", value: `${toNumber(query.data?.ctr)}%` },
    { label: "Active Promotions", value: toNumber(query.data?.active_promotions) },
    { label: "Total Promotions Started", value: toNumber(query.data?.total_promotions_started) },
  ];

  return (
    <Card
      id="vip-analytics"
      className="border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] p-5 text-slate-100 sm:p-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            VIP analytics
          </p>
          <h3 className="mt-1 text-xl font-semibold text-white">Merchant performance</h3>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((period) => (
            <Button
              key={period}
              type="button"
              size="sm"
              variant={days === period ? "default" : "outline"}
              className={
                days === period
                  ? "bg-[#35d879] text-[#04120a] hover:bg-[#52e98f]"
                  : "border-white/10 bg-transparent text-slate-200 hover:bg-white/5"
              }
              onClick={() => setDays(period)}
            >
              {period}D
            </Button>
          ))}
        </div>
      </div>

      {query.isLoading && (
        <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading advanced analytics…
        </div>
      )}
      {query.isError && (
        <div className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/5 p-4 text-sm text-rose-100">
          VIP analytics are temporarily unavailable.{" "}
          <Button
            variant="outline"
            size="sm"
            className="ml-3 border-rose-200/15 bg-transparent"
            onClick={() => void query.refetch()}
          >
            Retry
          </Button>
        </div>
      )}
      {!query.isLoading && !query.isError && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summary.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#07170f]/80 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-200">Daily performance</p>
              <Badge className="border-emerald-300/15 bg-emerald-300/10 text-emerald-100">
                Real backend data
              </Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {(
                [
                  ["Impressions", query.data?.impressions_daily],
                  ["Views", query.data?.views_daily],
                  ["Saves", query.data?.saves_daily],
                  ["Chats", query.data?.chats_daily],
                  ["WhatsApp", query.data?.whatsapp_daily],
                  ["Phone", query.data?.phone_daily],
                  ["Shares", query.data?.shares_daily],
                ] as Array<[string, unknown]>
              ).map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border border-white/8 bg-white/[0.02] p-3"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</p>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-lg font-semibold text-white">{toNumber(value)}</span>
                    <span className="text-[10px] text-slate-500">last {days}d</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

export function VipStaffSection({
  enabled,
  userId,
  context,
}: {
  enabled: boolean;
  userId: string;
  context: MerchantStaffContext | null | undefined;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"staff" | "manager">("staff");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const query = useQuery({
    queryKey: ["staff-accounts"],
    enabled,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("list_my_staff_accounts");
      if (error) throw new Error(error.message);
      return Array.isArray(data) ? data : [];
    },
  });

  const invite = async () => {
    if (!email.trim()) {
      toast.error("Enter a staff email to invite");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await rpcUntyped("invite_staff_member", {
        _email: email.trim(),
        _role: role,
      });
      if (error) throw new Error(error.message);
      const row = asRecord(data) ?? {};
      const token =
        typeof row.invite_token === "string"
          ? row.invite_token
          : row.token
            ? String(row.token)
            : null;
      const expiry =
        typeof row.expires_at === "string"
          ? row.expires_at
          : typeof row.expiry === "string"
            ? row.expiry
            : null;
      const url = token
        ? `${window.location.origin}/staff/accept?token=${encodeURIComponent(token)}`
        : null;
      setInviteToken(token ?? null);
      if (url) {
        toast.success("Invite created. Copy the link and share it securely.");
      } else {
        toast.success("Invite created successfully.");
      }
      if (expiry) {
        toast.info(`Invite expires ${new Date(expiry).toLocaleString()}`);
      }
      await query.refetch();
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create staff invite");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (staffId: string) => {
    try {
      const { data, error } = await rpcUntyped("revoke_staff_member", { _staff_id: staffId });
      if (error) throw new Error(error.message);
      toast.success(typeof data === "string" ? data : "Staff account revoked");
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to revoke staff account");
    }
  };

  const copyLink = async () => {
    if (!inviteToken) return;
    const value = `${window.location.origin}/staff/accept?token=${encodeURIComponent(inviteToken)}`;
    await navigator.clipboard.writeText(value);
    toast.success("Invite link copied");
  };

  if (!enabled) {
    return (
      <Card
        id="staff"
        className="border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] p-5 text-slate-100 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
              VIP Feature
            </p>
            <h3 className="mt-1 text-xl font-semibold text-white">Staff management</h3>
            <p className="mt-2 text-sm text-slate-400">
              Upgrade to VIP to create staff accounts, assign roles and manage merchant team access.
            </p>
            <Button
              asChild
              className="mt-4 rounded-xl bg-[#35d879] text-[#04120a] hover:bg-[#52e98f]"
            >
              <a href="#billing">Upgrade to VIP</a>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const staffRows = Array.isArray(query.data) ? query.data : [];

  return (
    <Card
      id="staff"
      className="border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] p-5 text-slate-100 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            Staff
          </p>
          <h3 className="mt-1 text-xl font-semibold text-white">Merchant team</h3>
        </div>
        <Badge className="border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-100">
          {context?.role ?? "owner"}
        </Badge>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-[#07170f]/80 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <div className="space-y-2">
            <Label
              htmlFor="staff-email"
              className="text-xs uppercase tracking-[0.18em] text-slate-400"
            >
              Staff email
            </Label>
            <Input
              id="staff-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="team@business.com"
              className="border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.18em] text-slate-400">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as "staff" | "manager")}>
              <SelectTrigger className="border-white/10 bg-white/5 text-slate-100">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">staff</SelectItem>
                <SelectItem value="manager">manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => void invite()}
            disabled={busy}
            className="self-end rounded-xl bg-[#35d879] text-[#04120a] hover:bg-[#52e98f]"
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Users className="mr-2 h-4 w-4" />
            )}
            Invite
          </Button>
        </div>

        {inviteToken && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-100">Invite link ready</p>
              <p className="text-xs text-emerald-100/80">
                The invited person must authenticate with the invited email before accepting.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-emerald-200/20 bg-transparent text-emerald-100 hover:bg-emerald-300/10"
                onClick={() => void copyLink()}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Invite Link
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-[1.4fr_1.1fr_0.8fr_0.7fr_0.9fr] gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {query.isLoading && (
          <div className="px-4 py-6 text-sm text-slate-400">Loading staff accounts…</div>
        )}
        {query.isError && (
          <div className="px-4 py-6 text-sm text-slate-400">
            Staff accounts could not be loaded.
          </div>
        )}
        {!query.isLoading && !query.isError && staffRows.length === 0 && (
          <div className="px-4 py-6 text-sm text-slate-400">No invited staff members yet.</div>
        )}
        {!query.isLoading &&
          !query.isError &&
          staffRows.map((member, index) => {
            const row = asRecord(member) ?? {};
            const name =
              typeof row.name === "string"
                ? row.name
                : typeof row.full_name === "string"
                  ? row.full_name
                  : `Member ${index + 1}`;
            const emailValue =
              typeof row.email === "string"
                ? row.email
                : typeof row.user_email === "string"
                  ? row.user_email
                  : "—";
            const roleValue = typeof row.role === "string" ? row.role : "staff";
            const status = typeof row.status === "string" ? row.status : "active";
            const joinedValue =
              typeof row.joined_at === "string"
                ? row.joined_at
                : typeof row.created_at === "string"
                  ? row.created_at
                  : null;
            const staffId =
              typeof row.id === "string"
                ? row.id
                : typeof row.staff_id === "string"
                  ? row.staff_id
                  : null;
            return (
              <div
                key={String(staffId ?? `${name}-${emailValue}`)}
                className="grid grid-cols-[1.4fr_1.1fr_0.8fr_0.7fr_0.9fr] gap-3 border-b border-white/10 px-4 py-3 text-sm text-slate-200 last:border-b-0"
              >
                <span>{name}</span>
                <span className="truncate">{emailValue}</span>
                <span className="capitalize">{roleValue}</span>
                <span className="capitalize text-slate-300">{status}</span>
                <div className="flex items-center justify-between gap-2">
                  {joinedValue && (
                    <span className="text-[10px] text-slate-400">
                      {new Date(joinedValue).toLocaleDateString()}
                    </span>
                  )}
                  {staffId ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-rose-300/15 bg-transparent text-rose-100 hover:bg-rose-300/10"
                      onClick={() => void revoke(staffId)}
                    >
                      Revoke
                    </Button>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </Card>
  );
}

export function VipIntegrationsSection({
  enabled,
  listings,
  userId,
}: {
  enabled: boolean;
  listings: { id: string; title: string; status: string }[];
  userId: string;
}) {
  const [busyChannel, setBusyChannel] = useState<string | null>(null);
  const [queuedFor, setQueuedFor] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["vip-channel-status"],
    enabled,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("get_vip_channel_status");
      if (error) throw new Error(error.message);
      return asRecord(data) ?? {};
    },
  });

  const toggleAutomation = async (channel: "google" | "meta", enabledState: boolean) => {
    setBusyChannel(channel);
    try {
      const { error } = await rpcUntyped("set_vip_channel_automation", {
        _channel: channel,
        _enabled: enabledState,
      });
      if (error) throw new Error(error.message);
      toast.success(
        `${channel === "google" ? "Google" : "Meta"} automation ${enabledState ? "enabled" : "disabled"}`,
      );
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update automation");
    } finally {
      setBusyChannel(null);
    }
  };

  const queuePublication = async (channel: "google" | "meta") => {
    const listing = listings[0];
    if (!listing) {
      toast.error("Create or select a listing to publish");
      return;
    }
    setQueuedFor(channel);
    try {
      const { error } = await rpcUntyped("queue_vip_channel_publication", {
        _listing_id: listing.id,
        _channel: channel,
        _scheduled_for: null,
      });
      if (error) throw new Error(error.message);
      toast.success(`${channel === "google" ? "Google" : "Meta"} publication queued`);
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to queue publication");
    } finally {
      setQueuedFor(null);
    }
  };

  if (!enabled) {
    return (
      <Card
        id="integrations"
        className="border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] p-5 text-slate-100 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200">
            <Globe className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
              VIP Feature
            </p>
            <h3 className="mt-1 text-xl font-semibold text-white">Integrations</h3>
            <p className="mt-2 text-sm text-slate-400">
              Upgrade to VIP to unlock Google Business and automated social posting controls.
            </p>
            <Button
              asChild
              className="mt-4 rounded-xl bg-[#35d879] text-[#04120a] hover:bg-[#52e98f]"
            >
              <a href="#billing">Upgrade to VIP</a>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const data = (query.data ?? {}) as Record<string, unknown>;
  const googleState = normalizeStatus(data.google ?? data.google_business ?? data.channel_status);
  const metaState = normalizeStatus(data.meta ?? data.social_status);
  const googleAutomation =
    data.google_automation === true ||
    data.google_enabled === true ||
    asRecord(data.automation)?.google === true;
  const metaAutomation =
    data.meta_automation === true ||
    data.meta_enabled === true ||
    asRecord(data.automation)?.meta === true;

  return (
    <Card
      id="integrations"
      className="border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] p-5 text-slate-100 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            Integrations
          </p>
          <h3 className="mt-1 text-xl font-semibold text-white">Business automation</h3>
        </div>
        <Badge className="border-emerald-300/15 bg-emerald-300/10 text-emerald-100">VIP</Badge>
      </div>

      {query.isLoading && (
        <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking connected channels…
        </div>
      )}
      {query.isError && (
        <div className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/5 p-4 text-sm text-rose-100">
          Channel status could not be loaded.
        </div>
      )}
      {!query.isLoading && !query.isError && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#07170f]/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-300" />{" "}
                <span className="font-medium text-white">Google Business</span>
              </div>
              <Badge
                className={
                  googleState === "connected"
                    ? "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100"
                    : googleState === "pending_setup" ||
                        googleState === "pending_external_integration"
                      ? "border-amber-300/20 bg-amber-300/[0.08] text-amber-100"
                      : googleState === "error"
                        ? "border-rose-300/20 bg-rose-300/[0.08] text-rose-100"
                        : "border-slate-300/15 bg-slate-300/[0.05] text-slate-200"
                }
              >
                {googleState === "connected"
                  ? "Connected"
                  : googleState === "queued"
                    ? "Queued"
                    : googleState === "published"
                      ? "Published"
                      : googleState === "error"
                        ? "Error"
                        : googleState === "pending_setup" ||
                            googleState === "pending_external_integration"
                          ? "Pending setup"
                          : "Not connected"}
              </Badge>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              {googleState === "connected"
                ? "Google Business is connected and ready for content automation."
                : googleState === "pending_setup" || googleState === "pending_external_integration"
                  ? "Credentials are needed before publishing can start."
                  : googleState === "queued"
                    ? "A Google publication is queued for delivery."
                    : googleState === "published"
                      ? "Your last publication was published successfully."
                      : "Connect Google Business to enable reviews, updates and publishing automation."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-white/10 bg-transparent text-slate-100 hover:bg-white/5"
              >
                {googleState === "connected" ? "Manage connection" : "Connect Google Business"}
              </Button>
              <Button
                variant="outline"
                className="border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100 hover:bg-emerald-300/[0.12]"
                onClick={() => void toggleAutomation("google", !googleAutomation)}
                disabled={busyChannel === "google"}
              >
                {busyChannel === "google" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {googleAutomation ? "Disable automation" : "Enable automation"}
              </Button>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-xs text-slate-300">
              <span>Queue publication</span>
              <Button
                size="sm"
                className="rounded-lg bg-[#35d879] text-[#04120a] hover:bg-[#52e98f]"
                onClick={() => void queuePublication("google")}
                disabled={queuedFor === "google"}
              >
                {queuedFor === "google" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Queue
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#07170f]/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-emerald-300" />{" "}
                <span className="font-medium text-white">Meta / social</span>
              </div>
              <Badge
                className={
                  metaState === "connected"
                    ? "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100"
                    : metaState === "pending_setup" || metaState === "pending_external_integration"
                      ? "border-amber-300/20 bg-amber-300/[0.08] text-amber-100"
                      : metaState === "error"
                        ? "border-rose-300/20 bg-rose-300/[0.08] text-rose-100"
                        : "border-slate-300/15 bg-slate-300/[0.05] text-slate-200"
                }
              >
                {metaState === "connected"
                  ? "Connected"
                  : metaState === "queued"
                    ? "Queued"
                    : metaState === "published"
                      ? "Published"
                      : metaState === "error"
                        ? "Error"
                        : metaState === "pending_setup" ||
                            metaState === "pending_external_integration"
                          ? "Ready to connect"
                          : "Ready to connect"}
              </Badge>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              {metaState === "connected"
                ? "Meta channels are available for automated posting."
                : "Connect the Meta account before publishing scheduled content."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-white/10 bg-transparent text-slate-100 hover:bg-white/5"
              >
                {metaState === "connected" ? "Manage Meta" : "Connect Meta"}
              </Button>
              <Button
                variant="outline"
                className="border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100 hover:bg-emerald-300/[0.12]"
                onClick={() => void toggleAutomation("meta", !metaAutomation)}
                disabled={busyChannel === "meta"}
              >
                {busyChannel === "meta" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {metaAutomation ? "Disable automation" : "Enable automation"}
              </Button>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-xs text-slate-300">
              <span>Queue publication</span>
              <Button
                size="sm"
                className="rounded-lg bg-[#35d879] text-[#04120a] hover:bg-[#52e98f]"
                onClick={() => void queuePublication("meta")}
                disabled={queuedFor === "meta"}
              >
                {queuedFor === "meta" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Queue
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export function VipAiAssistantSection({ enabled }: { enabled: boolean }) {
  const [prompt, setPrompt] = useState("Which products are performing best?");
  const query = useQuery({
    queryKey: ["ai-sales-context", 30],
    enabled,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("get_ai_sales_assistant_context", { _days: 30 });
      if (error) throw new Error(error.message);
      return asRecord(data) ?? {};
    },
  });

  if (!enabled) {
    return (
      <Card
        id="ai-sales-assistant"
        className="border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] p-5 text-slate-100 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
              VIP Feature
            </p>
            <h3 className="mt-1 text-xl font-semibold text-white">AI Sales Assistant</h3>
            <p className="mt-2 text-sm text-slate-400">
              Upgrade to VIP to unlock the intelligent sales dashboard and safe merchant insights.
            </p>
            <Button
              asChild
              className="mt-4 rounded-xl bg-[#35d879] text-[#04120a] hover:bg-[#52e98f]"
            >
              <a href="#billing">Upgrade to VIP</a>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const prompts = [
    "Which products are performing best?",
    "Which products should I promote?",
    "Which customers should I follow up with?",
    "How is my shop performing?",
    "What should I improve this week?",
  ];

  return (
    <Card
      id="ai-sales-assistant"
      className="border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] p-5 text-slate-100 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            AI sales assistant
          </p>
          <h3 className="mt-1 text-xl font-semibold text-white">AI Sales Assistant</h3>
        </div>
        <Badge className="border-emerald-300/15 bg-emerald-300/10 text-emerald-100">
          Safe merchant context
        </Badge>
      </div>

      {query.isLoading && (
        <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading sales context…
        </div>
      )}
      {query.isError && (
        <div className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/5 p-4 text-sm text-rose-100">
          The sales context could not be loaded.
        </div>
      )}

      {!query.isLoading && !query.isError && (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            {prompts.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPrompt(item)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${prompt === item ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#07170f]/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-emerald-300" />
                <span className="text-sm font-medium text-white">Assistant prompt</span>
              </div>
              <span className="text-xs text-slate-500">Last 30 days</span>
            </div>
            <p className="mt-3 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-sm text-slate-200">
              {prompt}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Top products
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {toNumber(query.data?.top_products_count)}
                </p>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Visits</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {toNumber(query.data?.total_views)}
                </p>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Inquiries</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {toNumber(query.data?.total_inquiries)}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-black/10 p-4 text-sm text-slate-300">
              Sales insights are generated from the backend-safe sales context and do not expose
              private account or document data.
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
