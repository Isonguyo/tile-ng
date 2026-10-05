import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { rpcUntyped } from "@/lib/waitlist-rpc";

export const Route = createFileRoute("/staff/accept")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({ meta: [{ title: "Accept staff invitation — Tile" }] }),
  component: AcceptStaffInvitation,
});

function AcceptStaffInvitation() {
  const { token } = Route.useSearch();
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const attempt = useRef("");
  const [state, setState] = useState<"idle" | "accepting" | "accepted" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || !user || loading) return;
    const key = `${user.id}:${token}`;
    if (attempt.current === key) return;
    attempt.current = key;
    setState("accepting");
    void (async () => {
      const { data, error } = await rpcUntyped("accept_staff_invite", { _token: token });
      if (error) {
        setMessage(error.message);
        setState("error");
        return;
      }
      const result = Array.isArray(data) ? data[0] : data;
      const row = result && typeof result === "object" ? (result as Record<string, unknown>) : null;
      if (row?.success === false || row?.accepted === false) {
        setMessage(
          typeof row.message === "string" ? row.message : "The invitation couldn't be accepted.",
        );
        setState("error");
        return;
      }
      setMessage("Your Tile merchant workspace access is now active.");
      setState("accepted");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["staff-context", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["staff-accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["tile-entitlements", user.id] }),
      ]);
    })();
  }, [loading, queryClient, token, user]);

  return (
    <div className="min-h-screen bg-[#06120d] text-slate-100">
      <SiteHeader />
      <main className="container mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center px-4 py-10">
        <Card className="w-full border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] p-6 sm:p-8">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${state === "accepted" ? "bg-emerald-300/10 text-emerald-200" : state === "error" ? "bg-rose-300/10 text-rose-200" : "bg-violet-300/10 text-violet-200"}`}
          >
            {state === "accepted" ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : state === "error" ? (
              <CircleAlert className="h-6 w-6" />
            ) : (
              <Users className="h-6 w-6" />
            )}
          </span>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            Merchant workspace
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Accept staff invitation
          </h1>
          {!token && (
            <p role="alert" className="mt-3 text-sm text-rose-200">
              This invitation link is missing its token. Ask the account owner for a new invite
              link.
            </p>
          )}
          {token && loading && (
            <p className="mt-3 text-sm text-slate-400">Checking your Tile sign-in…</p>
          )}
          {token && !loading && !user && (
            <>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Sign in using the email address this invitation was sent to. Tile will verify the
                invite and grant only the merchant workspace role assigned by the owner.
              </p>
              <Button
                asChild
                className="mt-5 bg-[#35d879] font-semibold text-[#04120a] hover:bg-[#52e98f]"
              >
                <Link
                  to="/login"
                  search={{ next: `/staff/accept?token=${encodeURIComponent(token)}` }}
                >
                  Sign in to continue
                </Link>
              </Button>
            </>
          )}
          {state === "accepting" && (
            <p role="status" className="mt-4 text-sm text-slate-300">
              Accepting your invitation…
            </p>
          )}
          {state === "error" && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-rose-300/15 bg-rose-300/[0.05] p-4 text-sm text-rose-100"
            >
              {message ||
                "The invitation couldn't be accepted. Check that you're signed in with the invited email address and that the invite hasn't expired."}
              <Button
                type="button"
                variant="outline"
                className="mt-3 block border-white/15 bg-transparent"
                onClick={() => {
                  attempt.current = "";
                  setState("idle");
                  setMessage("");
                }}
              >
                Try again
              </Button>
            </div>
          )}
          {state === "accepted" && (
            <div className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] p-4">
              <p role="status" className="text-sm text-emerald-100">
                {message}
              </p>
              <Button
                asChild
                className="mt-4 bg-[#35d879] font-semibold text-[#04120a] hover:bg-[#52e98f]"
              >
                <Link to="/dashboard">Open dashboard</Link>
              </Button>
            </div>
          )}
          {token && !user && (
            <p className="mt-4 text-xs text-slate-500">
              Your invitation token is only sent to Tile’s authenticated acceptance RPC. Never share
              it publicly.
            </p>
          )}
        </Card>
      </main>
    </div>
  );
}
