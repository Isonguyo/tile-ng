import { useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth-context";
import { rpcUntyped } from "@/lib/waitlist-rpc";
import { showError } from "@/lib/user-feedback";
import { toast } from "sonner";
import { LifeBuoy, MessageSquare, Plus, Send } from "lucide-react";

type SupportMode = "customer" | "admin";
type UnknownRow = Record<string, unknown>;

type SupportTicket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  tier: string | null;
};

type SupportMessage = {
  id: string;
  content: string;
  created_at: string | null;
  sender_id: string | null;
  sender_name: string | null;
  sender_role: string | null;
};

function record(value: unknown): UnknownRow | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRow
    : null;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function unwrapRows(value: unknown): UnknownRow[] {
  if (Array.isArray(value)) return value.map(record).filter((row): row is UnknownRow => !!row);
  const root = record(value);
  if (!root) return [];
  for (const key of ["tickets", "data", "results"]) {
    if (Array.isArray(root[key])) return unwrapRows(root[key]);
  }
  return [root];
}

function ticketFromRow(row: UnknownRow): SupportTicket | null {
  const id = text(row.id ?? row.ticket_id);
  if (!id) return null;
  return {
    id,
    subject: text(row.subject, "Support request"),
    category: text(row.category, "General"),
    priority: text(row.priority, "normal"),
    status: text(row.status, "open"),
    created_at: text(row.created_at ?? row.created_on) || null,
    updated_at: text(row.updated_at ?? row.last_updated ?? row.created_at) || null,
    user_id: text(row.user_id ?? row.requester_id) || null,
    user_name: text(row.user_name ?? row.full_name ?? row.requester_name) || null,
    user_email: text(row.user_email ?? row.email ?? row.requester_email) || null,
    tier: text(row.tier ?? row.subscription_tier) || null,
  };
}

function messageRows(value: unknown): SupportMessage[] {
  const rows = Array.isArray(value) ? value : [];
  return rows.map((item, index) => {
    const row = record(item) ?? {};
    return {
      id: text(row.id, "message-" + index),
      content: text(row.content ?? row.message ?? row.body),
      created_at: text(row.created_at) || null,
      sender_id: text(row.sender_id ?? row.user_id) || null,
      sender_name: text(row.sender_name ?? row.full_name) || null,
      sender_role: text(row.sender_role ?? row.role) || null,
    };
  });
}

function displayStatus(status: string): string {
  const labels: Record<string, string> = {
    open: "Open",
    awaiting_support: "Awaiting Support",
    awaiting_you: "Awaiting You",
    resolved: "Resolved",
    closed: "Closed",
  };
  return labels[status] ?? status.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function priorityRank(priority: string): number {
  return ({ urgent: 0, high: 1, normal: 2, low: 3 } as Record<string, number>)[priority.toLowerCase()] ?? 4;
}

function dateLabel(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export function SupportCenter({ mode }: { mode: SupportMode }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [initialMessage, setInitialMessage] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const ticketQuery = useQuery({
    queryKey: ["support-tickets", mode, user?.id, filter],
    enabled: !!user && (mode === "customer" || mode === "admin"),
    queryFn: async () => {
      const result = mode === "admin"
        ? await rpcUntyped("admin_list_support_tickets", { _status: filter === "all" ? null : filter })
        : await rpcUntyped("get_my_support_tickets");
      if (result.error) throw result.error;
      return unwrapRows(result.data)
        .map(ticketFromRow)
        .filter((ticket): ticket is SupportTicket => !!ticket);
    },
  });

  const tickets = useMemo(() => {
    const rows = ticketQuery.data ?? [];
    if (mode !== "admin") return rows;
    return [...rows].sort((a, b) =>
      priorityRank(a.priority) - priorityRank(b.priority) ||
      new Date(b.updated_at ?? b.created_at ?? 0).getTime() -
        new Date(a.updated_at ?? a.created_at ?? 0).getTime(),
    );
  }, [mode, ticketQuery.data]);

  const threadQuery = useQuery({
    queryKey: ["support-ticket", activeTicketId],
    enabled: !!activeTicketId && !!user,
    queryFn: async () => {
      const result = await rpcUntyped("get_support_ticket", { _ticket_id: activeTicketId });
      if (result.error) throw result.error;
      const rows = unwrapRows(result.data);
      const root = rows[0] ?? record(result.data);
      if (!root) return { ticket: null, messages: [] as SupportMessage[] };
      const ticket = ticketFromRow(record(root.ticket) ?? root);
      const rawMessages = root.messages ?? root.support_messages ?? root.conversation ??
        (rows.some((row) => typeof row.content === "string" || typeof row.message === "string" || typeof row.body === "string")
          ? rows
          : []);
      return { ticket, messages: messageRows(rawMessages) };
    },
    refetchInterval: activeTicketId ? 15_000 : false,
  });

  const refreshTickets = async (ticketId?: string) => {
    await qc.invalidateQueries({ queryKey: ["support-tickets"] });
    if (ticketId) await qc.invalidateQueries({ queryKey: ["support-ticket", ticketId] });
  };

  const createTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) {
      toast.error("Add a subject and message to continue.");
      return;
    }
    setSending(true);
    try {
      const { error } = await rpcUntyped("create_support_ticket", {
        _subject: subject.trim(),
        _message: initialMessage.trim(),
        _category: category,
      });
      if (error) return showError(error, "We couldn't create your support ticket. Please try again.");
      toast.success("Your support ticket has been created.");
      setSubject("");
      setInitialMessage("");
      setCategory("general");
      setCreateOpen(false);
      await refreshTickets();
    } catch (error) {
      showError(error, "We couldn't create your support ticket. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const sendReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeTicketId || !reply.trim()) return;
    setSending(true);
    try {
      const { error } = await rpcUntyped("add_support_message", {
        _ticket_id: activeTicketId,
        _message: reply.trim(),
      });
      if (error) return showError(error, "We couldn't send your reply. Please try again.");
      setReply("");
      toast.success("Reply sent.");
      await refreshTickets(activeTicketId);
    } catch (error) {
      showError(error, "We couldn't send your reply. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const setStatus = async (status: string) => {
    if (!activeTicketId) return;
    try {
      const { error } = await rpcUntyped("admin_set_support_ticket_status", {
        _ticket_id: activeTicketId,
        _status: status,
      });
      if (error) return showError(error, "We couldn't update this ticket. Please try again.");
      toast.success("Ticket status updated.");
      await refreshTickets(activeTicketId);
    } catch (error) {
      showError(error, "We couldn't update this ticket. Please try again.");
    }
  };

  const isAdmin = mode === "admin";
  const activeTicket = threadQuery.data?.ticket ??
    tickets.find((ticket) => ticket.id === activeTicketId) ?? null;
  const cardStyle = isAdmin
    ? "border-border/60 bg-card/70"
    : "border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] text-slate-100";
  const mutedStyle = isAdmin ? "text-muted-foreground" : "text-slate-400";

  return (
    <section id={isAdmin ? "admin-support" : "support"} className="space-y-4">
      <Card className={"p-5 sm:p-6 " + cardStyle}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className={"mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + (isAdmin ? "bg-primary/10 text-primary" : "bg-emerald-300/10 text-emerald-300")}>
              <LifeBuoy className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold">{isAdmin ? "Support Center" : "Support"}</h2>
              <p className={"mt-1 max-w-2xl text-sm " + mutedStyle}>
                {isAdmin
                  ? "Review requests in backend priority order and reply in the existing ticket conversation."
                  : "Create a request or continue an existing conversation with Tile Support."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Filter tickets" /></SelectTrigger>
                <SelectContent>
                  {["all", "open", "awaiting_support", "awaiting_you", "resolved", "closed"].map((status) => (
                    <SelectItem key={status} value={status}>{displayStatus(status)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!isAdmin && (
              <Button onClick={() => setCreateOpen(true)} className="h-10 rounded-xl bg-[#35d879] font-semibold text-[#04120a] hover:bg-[#52e98f]">
                <Plus className="mr-2 h-4 w-4" />Create ticket
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5">
          {ticketQuery.isLoading && <p className={"py-8 text-center text-sm " + mutedStyle}>Loading support requests…</p>}
          {ticketQuery.isError && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-4 text-sm">
              <p>We couldn't load support requests.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => void ticketQuery.refetch()}>Try again</Button>
            </div>
          )}
          {!ticketQuery.isLoading && !ticketQuery.isError && tickets.length === 0 && (
            <div className={"rounded-xl border border-dashed p-6 text-center " + (isAdmin ? "border-border" : "border-white/10 bg-black/10")}>
              <MessageSquare className={"mx-auto h-6 w-6 " + mutedStyle} />
              <p className="mt-2 text-sm font-medium">{isAdmin ? "No tickets in this view." : "No support tickets yet."}</p>
              {!isAdmin && <p className={"mt-1 text-xs " + mutedStyle}>Create a ticket and your conversation will appear here.</p>}
            </div>
          )}
          {tickets.length > 0 && (
            <>
              {isAdmin && (
                <div className="hidden overflow-hidden rounded-xl border border-border/60 xl:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell><Badge variant="outline" className="capitalize">{ticket.priority}</Badge></TableCell>
                          <TableCell><Badge variant={ticket.status === "resolved" || ticket.status === "closed" ? "secondary" : "default"}>{displayStatus(ticket.status)}</Badge></TableCell>
                          <TableCell className="max-w-[240px]">
                            <button type="button" onClick={() => setActiveTicketId(ticket.id)} className="block max-w-full truncate text-left font-semibold text-foreground hover:text-primary">
                              {ticket.subject}
                            </button>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{ticket.user_name ?? ticket.user_email ?? "—"}</TableCell>
                          <TableCell className="capitalize">{ticket.tier ?? "—"}</TableCell>
                          <TableCell className="capitalize">{ticket.category}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs">{dateLabel(ticket.created_at)}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs">{dateLabel(ticket.updated_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className={"grid gap-2 " + (isAdmin ? "xl:hidden" : "")}>
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setActiveTicketId(ticket.id)}
                  className={"w-full rounded-xl border p-4 text-left transition-colors " +
                    (isAdmin
                      ? "border-border/60 bg-background/60 hover:border-primary/40"
                      : "border-white/[0.08] bg-[#07170f]/70 hover:border-emerald-300/30 hover:bg-[#0b2117]")}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{ticket.subject}</p>
                      <p className={"mt-1 text-xs " + mutedStyle}>
                        {ticket.category}{isAdmin && (ticket.user_name || ticket.user_email)
                          ? " · " + (ticket.user_name ?? ticket.user_email)
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Badge variant="outline" className="capitalize">{ticket.priority}</Badge>
                      {isAdmin && ticket.tier && <Badge variant="secondary" className="capitalize">{ticket.tier}</Badge>}
                      <Badge variant={ticket.status === "resolved" || ticket.status === "closed" ? "secondary" : "default"}>
                        {displayStatus(ticket.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className={"mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] " + mutedStyle}>
                    <span>Created {dateLabel(ticket.created_at)}</span>
                    <span>Updated {dateLabel(ticket.updated_at)}</span>
                  </div>
                </button>
              ))}
              </div>
            </>
          )}
        </div>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Create a support ticket</DialogTitle></DialogHeader>
          <form onSubmit={createTicket} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="support-subject">Subject</Label>
              <Input id="support-subject" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={120} required />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["general", "account", "payment", "listing", "shop", "safety"].map((item) => (
                    <SelectItem key={item} value={item}>{displayStatus(item)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-message">Message</Label>
              <Textarea id="support-message" value={initialMessage} onChange={(event) => setInitialMessage(event.target.value)} rows={5} maxLength={5000} required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={sending}>{sending ? "Creating…" : "Send ticket"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeTicketId} onOpenChange={(open) => { if (!open) setActiveTicketId(null); }}>
        <DialogContent className="flex max-h-[92dvh] flex-col overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b px-5 py-4 pr-12 sm:px-6">
            <DialogTitle className="truncate">{activeTicket?.subject ?? "Support conversation"}</DialogTitle>
            {activeTicket && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="outline" className="capitalize">{activeTicket.priority}</Badge>
                <Badge variant="secondary">{displayStatus(activeTicket.status)}</Badge>
                <span className={"text-xs " + mutedStyle}>{activeTicket.category}</span>
              </div>
            )}
            {isAdmin && activeTicket && (
              <div className="pt-2">
                <Label className="text-xs">Update status</Label>
                <Select value={activeTicket.status} onValueChange={(value) => void setStatus(value)}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["open", "awaiting_support", "awaiting_you", "resolved", "closed"].map((status) => (
                      <SelectItem key={status} value={status}>{displayStatus(status)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
            {threadQuery.isLoading && <p className={"py-8 text-center text-sm " + mutedStyle}>Loading conversation…</p>}
            {threadQuery.isError && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-4 text-sm">
                <p>We couldn't load this conversation.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => void threadQuery.refetch()}>Try again</Button>
              </div>
            )}
            {(threadQuery.data?.messages ?? []).map((message) => {
              const mine = !!user?.id && message.sender_id === user.id;
              const fromSupport = message.sender_role === "admin" || message.sender_role === "support" || (isAdmin && !mine);
              return (
                <div key={message.id} className={"max-w-[92%] rounded-2xl border p-3 sm:max-w-[85%] " +
                  (mine
                    ? "ml-auto border-emerald-300/20 bg-emerald-300/[0.09]"
                    : isAdmin
                      ? "border-border bg-muted/30"
                      : "border-white/[0.08] bg-[#07170f]")}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold">{mine ? "You" : message.sender_name ?? (fromSupport ? "Tile Support" : "Customer")}</p>
                    <p className={"text-[10px] " + mutedStyle}>{dateLabel(message.created_at)}</p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                </div>
              );
            })}
            {!threadQuery.isLoading && !threadQuery.isError && (threadQuery.data?.messages.length ?? 0) === 0 && (
              <p className={"py-8 text-center text-sm " + mutedStyle}>No messages are available for this ticket.</p>
            )}
          </div>
          <form onSubmit={sendReply} className="shrink-0 border-t p-3 sm:p-4">
            <div className="flex items-end gap-2">
              <Textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Write a reply…"
                rows={2}
                maxLength={5000}
                className="min-h-11 resize-y"
                aria-label="Reply to support ticket"
              />
              <Button type="submit" className="h-11 shrink-0" disabled={sending || !reply.trim() || threadQuery.isLoading}>
                <Send className="mr-2 h-4 w-4" />{sending ? "Sending…" : "Reply"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
