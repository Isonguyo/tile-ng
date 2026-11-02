import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type AccountTypeFilter = "merchant_artisan" | "all" | "merchant" | "artisan" | "buyer";
type AuthStatusFilter = "all" | "verified" | "unverified";

type RegisteredAccount = {
  user_id: string;
  email: string;
  email_confirmed_at: string | null;
  full_name: string | null;
  phone: string | null;
  state: string | null;
  lga: string | null;
  account_type: "merchant" | "artisan" | "buyer";
  business_name: string | null;
  shop_slug: string | null;
  shop_status: string | null;
  artisan_status: string | null;
  created_at: string;
  total_count?: number;
};

type AccountsResponse = {
  success: boolean;
  accounts: RegisteredAccount[];
  page: number;
  per_page: number;
  total_count: number;
  has_more: boolean;
};

type AccessLink = { link: string; email: string; phone: string | null; name: string };

class AdminAccessError extends Error {
  code: string;
  status: number | undefined;

  constructor(message: string, code = "", status?: number) {
    super(message);
    this.name = "AdminAccessError";
    this.code = code;
    this.status = status;
  }
}

async function invokeAdmin<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>("admin-user-access", { body });
  const payload = data as (T & { success?: boolean; error?: string; code?: string }) | null;
  if (!error && payload?.success !== false && !payload?.error) {
    if (!payload) throw new AdminAccessError("The access service returned an empty response.");
    return payload;
  }

  const context = (error as { context?: unknown } | null)?.context;
  let status: number | undefined;
  let detail = payload;
  if (context && typeof context === "object" && "status" in context) {
    status = Number((context as { status: number }).status);
    if (typeof (context as { clone?: unknown }).clone === "function") {
      try {
        detail = (await (context as Response).clone().json()) as typeof payload;
      } catch {
        // Retain any response body already returned by functions.invoke.
      }
    }
  }
  const failure = detail as { error?: string; code?: string } | null;
  throw new AdminAccessError(
    failure?.error ?? error?.message ?? "The account access request failed.",
    failure?.code ?? "",
    status,
  );
}

function errorText(error: unknown) {
  if (!(error instanceof AdminAccessError))
    return "The account access request failed. Please try again.";
  if (error.code === "EMAIL_NOT_CONFIRMED")
    return "This account's email is not verified. Resend the verification email to continue.";
  if (error.code === "EMAIL_ALREADY_CONFIRMED")
    return "This account's email is already verified. Generate a password setup link instead.";
  if (error.status === 404 || error.code === "USER_NOT_FOUND")
    return "This account no longer exists. Refresh the account list.";
  if (error.status === 403)
    return "Administrator authorization failed. Sign in with a Tile Admin account and try again.";
  if (error.status === 409)
    return error.message || "The account state does not permit this action.";
  return error.message || "The account access request failed. Please try again.";
}

function isDuplicateEmail(error: unknown) {
  if (!(error instanceof AdminAccessError)) return false;
  return /email.*already|already.*email|already_exists|user_already_exists|email_exists|duplicate_email/i.test(
    `${error.code} ${error.message}`,
  );
}

function statusLabel(value: string | null | undefined) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function UserOnboardingPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [accountType, setAccountType] = useState<AccountTypeFilter>("merchant_artisan");
  const [authStatus, setAuthStatus] = useState<AuthStatusFilter>("all");
  const [page, setPage] = useState(1);
  const perPage = 50;

  const [selectedAccount, setSelectedAccount] = useState<RegisteredAccount | null>(null);
  const [accessLink, setAccessLink] = useState<AccessLink | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionHint, setActionHint] = useState<"generate" | "resend" | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteResult, setInviteResult] = useState<AccessLink | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inviteType, setInviteType] = useState<"buyer" | "merchant" | "artisan">("buyer");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [businessName, setBusinessName] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchTerm(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const accountsQuery = useQuery({
    queryKey: ["admin-onboarding-accounts", searchTerm, accountType, authStatus, page, perPage],
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    queryFn: async () => {
      const response = await invokeAdmin<AccountsResponse>({
        action: "list_accounts",
        search: searchTerm,
        account_type: accountType,
        auth_status: authStatus,
        page,
        per_page: perPage,
      });
      return response;
    },
  });

  const accounts = accountsQuery.data?.accounts ?? [];
  const totalCount = accountsQuery.data?.total_count ?? accounts[0]?.total_count ?? 0;
  const hasMore = accountsQuery.data?.has_more ?? false;

  const selectAccount = (account: RegisteredAccount) => {
    setAccessLink(null);
    setActionError("");
    setActionHint(null);
    setResendSent(false);
    setSelectedAccount(account);
  };

  const closeAccount = () => {
    setSelectedAccount(null);
    setAccessLink(null);
    setActionError("");
    setActionHint(null);
    setResendSent(false);
  };

  const generateExistingAccess = async () => {
    if (!selectedAccount) return;
    setActionBusy(true);
    setAccessLink(null);
    setActionError("");
    setResendSent(false);
    try {
      const response = await invokeAdmin<{
        success: boolean;
        action: string;
        user_id: string;
        email: string;
        recovery_link: string;
      }>({
        action: "generate_existing_access",
        user_id: selectedAccount.user_id,
      });
      if (response.user_id !== selectedAccount.user_id)
        throw new AdminAccessError("The service returned a link for a different account.");
      if (!response.recovery_link)
        throw new AdminAccessError("The service did not return a password setup link.");
      setAccessLink({
        link: response.recovery_link,
        email: response.email || selectedAccount.email,
        phone: selectedAccount.phone,
        name: selectedAccount.full_name || selectedAccount.email,
      });
    } catch (error) {
      const failure =
        error instanceof AdminAccessError
          ? error
          : new AdminAccessError("The account access request failed. Please try again.");
      setActionError(errorText(failure));
      if (failure.code === "EMAIL_NOT_CONFIRMED") setActionHint("resend");
      if (failure.code === "EMAIL_ALREADY_CONFIRMED") setActionHint("generate");
      if (failure.status === 404 || failure.code === "USER_NOT_FOUND") {
        closeAccount();
        await queryClient.invalidateQueries({ queryKey: ["admin-onboarding-accounts"] });
      }
    } finally {
      setActionBusy(false);
    }
  };

  const resendConfirmation = async () => {
    if (!selectedAccount) return;
    setActionBusy(true);
    setActionError("");
    setAccessLink(null);
    setResendSent(false);
    try {
      await invokeAdmin<{ success: boolean; action: string; user_id: string }>({
        action: "resend_confirmation",
        user_id: selectedAccount.user_id,
      });
      setResendSent(true);
      setActionHint(null);
      toast.success(`Verification email sent to ${selectedAccount.email}.`);
      await queryClient.invalidateQueries({ queryKey: ["admin-onboarding-accounts"] });
    } catch (error) {
      const failure =
        error instanceof AdminAccessError
          ? error
          : new AdminAccessError("The verification email could not be resent.");
      setActionError(errorText(failure));
      if (failure.code === "EMAIL_ALREADY_CONFIRMED") setActionHint("generate");
      if (failure.code === "EMAIL_NOT_CONFIRMED") setActionHint("resend");
      if (failure.status === 404 || failure.code === "USER_NOT_FOUND") {
        closeAccount();
        await queryClient.invalidateQueries({ queryKey: ["admin-onboarding-accounts"] });
      }
    } finally {
      setActionBusy(false);
    }
  };

  const createInvitation = async (event: FormEvent) => {
    event.preventDefault();
    setInviteBusy(true);
    setInviteError("");
    setInviteResult(null);
    try {
      const response = await invokeAdmin<{
        success: boolean;
        activation_link: string;
        email?: string;
        full_name?: string;
      }>({
        action: "create_invite",
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        account_type: inviteType,
        state: state.trim(),
        lga: lga.trim(),
        business_name: businessName.trim(),
      });
      if (!response.activation_link)
        throw new AdminAccessError("The service did not return an activation link.");
      setInviteResult({
        link: response.activation_link,
        email: response.email || email.trim(),
        phone: phone.trim(),
        name: response.full_name || fullName.trim(),
      });
      setFullName("");
      setEmail("");
      setPhone("");
      setState("");
      setLga("");
      setBusinessName("");
      await queryClient.invalidateQueries({ queryKey: ["admin-onboarding-accounts"] });
    } catch (error) {
      if (isDuplicateEmail(error)) {
        setInviteError(
          "This email already has an account. Find it in Registered Accounts and manage access there.",
        );
      } else {
        setInviteError(errorText(error));
      }
    } finally {
      setInviteBusy(false);
    }
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Clipboard access is unavailable in this browser.");
    }
  };

  const linkMessage = (link: AccessLink, mode: "setup" | "invite") =>
    mode === "invite"
      ? `Hello ${link.name},\n\nYour Tile account invitation is ready. Open this secure link to activate your account and choose your password:\n\n${link.link}\n\nPlease keep this link private. Welcome to Tile.`
      : `Hello ${link.name},\n\nWe have generated a secure Tile password setup link for your account. Open it to establish or reset your password:\n\n${link.link}\n\nPlease keep this link private.`;

  const accountAction =
    selectedAccount &&
    (actionHint === "generate" || (actionHint !== "resend" && !!selectedAccount.email_confirmed_at)
      ? "generate"
      : "resend");

  const field = (
    label: string,
    value: string,
    set: (value: string) => void,
    required = false,
    type = "text",
  ) => (
    <label className="grid gap-1 text-sm">
      {label}
      {required ? " *" : ""}
      <Input
        type={type}
        required={required}
        value={value}
        onChange={(event) => set(event.target.value)}
      />
    </label>
  );

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Registered Accounts</h2>
            <p className="text-sm text-muted-foreground">
              Manage access for existing merchant and artisan accounts without changing their
              approval status.
            </p>
          </div>
          <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
            {totalCount.toLocaleString()} accounts
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            Search accounts
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, email, phone or business"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Account type
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={accountType}
              onChange={(event) => {
                setAccountType(event.target.value as AccountTypeFilter);
                setPage(1);
              }}
            >
              <option value="merchant_artisan">Merchants and artisans</option>
              <option value="all">All accounts</option>
              <option value="merchant">Merchants</option>
              <option value="artisan">Artisans</option>
              <option value="buyer">Buyers</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Email status
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={authStatus}
              onChange={(event) => {
                setAuthStatus(event.target.value as AuthStatusFilter);
                setPage(1);
              }}
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </label>
        </div>
        {accountsQuery.isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <p>{errorText(accountsQuery.error)}</p>
            <Button
              className="mt-2"
              size="sm"
              variant="outline"
              onClick={() => void accountsQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        )}
        {accountsQuery.isPending ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading registered accounts…
          </p>
        ) : !accountsQuery.isError && accounts.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No accounts match these filters.
          </p>
        ) : (
          <div className="space-y-2">
            {accounts.map((account) => (
              <article
                key={account.user_id}
                className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="font-semibold">{account.full_name || "Unnamed account"}</h3>
                    <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">
                      {account.account_type}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${account.email_confirmed_at ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}`}
                    >
                      {account.email_confirmed_at ? "Email verified" : "Email unverified"}
                    </span>
                  </div>
                  <p className="break-all text-sm text-muted-foreground">
                    {account.email}
                    {account.phone ? ` | ${account.phone}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {account.business_name ? `${account.business_name} | ` : ""}Registered{" "}
                    {account.created_at
                      ? new Date(account.created_at).toLocaleDateString()
                      : "date unavailable"}
                    {account.account_type === "merchant" && account.shop_status
                      ? ` | Shop: ${statusLabel(account.shop_status)}`
                      : ""}
                    {account.account_type === "artisan" && account.artisan_status
                      ? ` | Artisan: ${statusLabel(account.artisan_status)}`
                      : ""}
                  </p>
                </div>
                <Button variant="outline" onClick={() => selectAccount(account)}>
                  Manage Access
                </Button>
              </article>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between border-t pt-3">
          <p className="text-xs text-muted-foreground">
            Page {page}
            {accountsQuery.isFetching ? " | Refreshing…" : ""}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1 || accountsQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!hasMore || accountsQuery.isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Create New Invitation</h2>
            <p className="text-sm text-muted-foreground">
              Create an account for a new user who is not listed above.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setInviteOpen((open) => !open);
              setInviteError("");
              setInviteResult(null);
            }}
          >
            {inviteOpen ? "Close invitation form" : "Create new invitation"}
          </Button>
        </div>
        {inviteOpen && (
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(event) => void createInvitation(event)}
          >
            {field("Full name", fullName, setFullName, true)}
            {field("Email address", email, setEmail, true, "email")}
            {field("Phone / WhatsApp", phone, setPhone)}
            <label className="grid gap-1 text-sm">
              Account type
              <select
                className="h-10 rounded-md border bg-background px-3"
                value={inviteType}
                onChange={(event) => setInviteType(event.target.value as typeof inviteType)}
              >
                {["buyer", "merchant", "artisan"].map((type) => (
                  <option key={type} value={type}>
                    {type[0].toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            {field("State", state, setState)}
            {field("LGA", lga, setLga)}
            {inviteType !== "buyer" && field("Business name", businessName, setBusinessName)}
            {inviteError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive sm:col-span-2">
                {inviteError}
              </p>
            )}
            <Button className="sm:col-span-2" disabled={inviteBusy}>
              {inviteBusy ? "Creating…" : "Create Account & Generate Activation Link"}
            </Button>
          </form>
        )}
        {inviteResult && (
          <div className="space-y-3 rounded-lg border border-primary/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">Invitation link ready</h3>
                <p className="text-sm text-muted-foreground">
                  The user must open this link and choose their own password.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setInviteResult(null)}>
                Close
              </Button>
            </div>
            <p className="text-sm">
              {inviteResult.name} | {inviteResult.email}
            </p>
            <div className="break-all rounded-md bg-muted p-3 text-sm">{inviteResult.link}</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void copyText(inviteResult.link)}>
                Copy Link
              </Button>
              <Button
                variant="outline"
                onClick={() => void copyText(linkMessage(inviteResult, "invite"))}
              >
                Copy WhatsApp Message
              </Button>
              {inviteResult.phone && (
                <Button asChild variant="outline">
                  <a
                    href={`https://wa.me/${inviteResult.phone.replace(/\D/g, "")}?text=${encodeURIComponent(linkMessage(inviteResult, "invite"))}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      <Dialog
        open={!!selectedAccount}
        onOpenChange={(open) => {
          if (!open) closeAccount();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Account Access</DialogTitle>
            <DialogDescription>
              Generate a link or resend verification for the selected registered account. These
              actions do not change shop or artisan review status.
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="font-semibold">{selectedAccount.full_name || "Unnamed account"}</p>
                <p className="break-all text-sm text-muted-foreground">{selectedAccount.email}</p>
                <p className="mt-1 text-xs capitalize text-muted-foreground">
                  {selectedAccount.account_type}
                  {selectedAccount.business_name
                    ? ` | ${selectedAccount.business_name}`
                    : ""} |{" "}
                  {selectedAccount.email_confirmed_at ? "Email verified" : "Email unverified"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[selectedAccount.lga, selectedAccount.state].filter(Boolean).join(", ") ||
                    "Location not provided"}{" "}
                  | Registered{" "}
                  {selectedAccount.created_at
                    ? new Date(selectedAccount.created_at).toLocaleDateString()
                    : "date unavailable"}
                  {selectedAccount.account_type === "merchant" && selectedAccount.shop_status
                    ? ` | Shop: ${statusLabel(selectedAccount.shop_status)}`
                    : ""}
                  {selectedAccount.account_type === "artisan" && selectedAccount.artisan_status
                    ? ` | Artisan: ${statusLabel(selectedAccount.artisan_status)}`
                    : ""}
                </p>
              </div>
              {actionError && (
                <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {actionError}
                </p>
              )}
              {accountAction === "generate" && (
                <Button
                  className="w-full"
                  disabled={actionBusy}
                  onClick={() => void generateExistingAccess()}
                >
                  {actionBusy ? "Generating link…" : "Generate Password Setup Link"}
                </Button>
              )}
              {accountAction === "resend" && (
                <Button
                  className="w-full"
                  disabled={actionBusy || resendSent}
                  onClick={() => void resendConfirmation()}
                >
                  {actionBusy
                    ? "Sending verification email…"
                    : resendSent
                      ? "Verification email sent"
                      : "Resend Email Verification"}
                </Button>
              )}
              {resendSent && (
                <p className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
                  Verification email sent to {selectedAccount.email}. Tile sent the email through
                  the account verification service.
                </p>
              )}
              {accessLink && (
                <div className="space-y-3 rounded-lg border border-primary/30 p-3">
                  <div>
                    <p className="font-semibold">Password setup link generated</p>
                    <p className="text-sm text-muted-foreground">
                      This secure link lets the account owner establish or reset their password.
                      Keep it private.
                    </p>
                  </div>
                  <div className="break-all rounded-md bg-muted p-3 text-sm">{accessLink.link}</div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => void copyText(accessLink.link)}>
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void copyText(linkMessage(accessLink, "setup"))}
                    >
                      Copy WhatsApp Message
                    </Button>
                    {accessLink.phone && (
                      <Button asChild variant="outline">
                        <a
                          href={`https://wa.me/${accessLink.phone.replace(/\D/g, "")}?text=${encodeURIComponent(linkMessage(accessLink, "setup"))}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open WhatsApp
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
