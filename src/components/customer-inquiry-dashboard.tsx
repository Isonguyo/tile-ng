import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Inbox, LockKeyhole, MessageCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { rpcUntyped } from "@/lib/waitlist-rpc";

type Row = Record<string, unknown>;
type Inquiry = {
  chatId: string;
  product: string;
  customer: string;
  lastMessage: string;
  lastActivity: string | null;
  unread: number | null;
};

type ProductInquiry = {
  id: string;
  title: string;
  total: number | string | null;
  recent: number | string | null;
};

type InquiryDashboardData = {
  total: number | string | null;
  unread: number | string | null;
  recentTotal: number | string | null;
  active: number | string | null;
  topListings: ProductInquiry[];
  recentInquiries: Inquiry[];
};

function asRow(value: unknown): Row | null {
  if (Array.isArray(value)) return asRow(value[0]);
  return value && typeof value === "object" ? (value as Row) : null;
}

function text(row: Row, keys: string[], fallback: string): string {
  for (const key of keys) if (typeof row[key] === "string" && row[key]) return row[key] as string;
  return fallback;
}

function fieldValue(row: Row, keys: string[]): number | string | null {
  for (const key of keys) {
    const candidate = row[key];
    if (typeof candidate === "number" || typeof candidate === "string") return candidate;
  }
  return null;
}

function normalize(value: unknown): InquiryDashboardData {
  const root = asRow(value) ?? {};
  const inquiryRows =
    root.recent_inquiries ?? root.inquiries ?? root.conversations ?? root.chats ?? root.items ?? [];
  const recentInquiries = (Array.isArray(inquiryRows) ? inquiryRows : []).flatMap((item) => {
    const row = asRow(item);
    if (!row) return [];
    const chatId = text(row, ["chat_id", "chatId", "conversation_id"], "");
    if (!chatId) return [];
    const unreadValue = fieldValue(row, ["unread_count", "unread_messages"]);
    return [
      {
        chatId,
        product: text(
          row,
          ["listing_title", "product_title", "listing_name", "title"],
          "Listing inquiry",
        ),
        customer: text(row, ["customer_name", "buyer_name", "full_name"], "Customer"),
        lastMessage: text(
          row,
          ["last_message", "latest_message", "message_preview", "message"],
          "Open the conversation to view the latest message.",
        ),
        lastActivity:
          text(row, ["last_message_at", "last_activity_at", "updated_at", "created_at"], "") ||
          null,
        unread:
          typeof unreadValue === "number"
            ? unreadValue
            : typeof unreadValue === "string" && Number.isFinite(Number(unreadValue))
              ? Number(unreadValue)
              : null,
      },
    ];
  });
  const listingRows = root.top_listings ?? root.top_products ?? [];
  const topListings = (Array.isArray(listingRows) ? listingRows : []).flatMap((item, index) => {
    const row = asRow(item);
    if (!row) return [];
    return [
      {
        id: text(row, ["listing_id", "id"], `listing-${index}`),
        title: text(row, ["listing_title", "product_title", "title"], "Listing"),
        total: fieldValue(row, ["total_inquiries", "inquiry_count", "inquiries", "total"]),
        recent: fieldValue(row, [
          "inquiries_last_period",
          "recent_period_inquiries",
          "recent_inquiries",
          "recent",
        ]),
      },
    ];
  });
  return {
    total: fieldValue(root, ["total_inquiries"]),
    unread: fieldValue(root, ["unread_inquiries"]),
    recentTotal: fieldValue(root, ["inquiries_last_period"]),
    active: fieldValue(root, ["active_conversations"]),
    topListings,
    recentInquiries,
  };
}

function countLabel(count: number | string | null): string {
  return count === null ? "—" : typeof count === "number" ? count.toLocaleString() : count;
}

function timeLabel(value: string | null): string {
  if (!value) return "Recent activity";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent activity";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function CustomerInquiryDashboard({
  userId,
  hasAccess,
  entitlementsLoading = false,
}: {
  userId: string;
  hasAccess: boolean;
  entitlementsLoading?: boolean;
}) {
  const query = useQuery({
    queryKey: ["customer-inquiry-dashboard", userId, 30],
    enabled: hasAccess,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("get_customer_inquiry_dashboard", { _days: 30 });
      if (error) throw error;
      return normalize(data);
    },
  });

  return (
    <Card
      id="customer-inquiries"
      className="overflow-hidden border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] p-5 text-slate-100 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            Buyer conversations
          </p>
          <h3 className="mt-1 flex items-center gap-2 text-lg font-semibold">
            <Inbox className="h-5 w-5 text-emerald-300" />
            Customer inquiries
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Recent messages about your products and services.
          </p>
        </div>
        {hasAccess && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="shrink-0 border-white/15 bg-white/[0.03] text-slate-100 hover:bg-white/[0.08]"
          >
            <Link to="/messages">
              Open inbox
              <ArrowUpRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {entitlementsLoading && (
        <p className="mt-5 animate-pulse rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-sm text-slate-400">
          Checking plan access…
        </p>
      )}
      {!entitlementsLoading && !hasAccess && (
        <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-black/10 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <LockKeyhole className="h-4 w-4 text-slate-400" />
            Available with Pro and VIP
          </p>
          <p className="mt-1 text-xs text-slate-500">See and manage customer inquiries with Pro.</p>
          <Button asChild size="sm" className="mt-3 bg-[#35d879] text-[#04120a] hover:bg-[#52e98f]">
            <a href="#billing">Upgrade to Pro</a>
          </Button>
        </div>
      )}
      {!entitlementsLoading && hasAccess && query.isLoading && (
        <p className="mt-5 py-8 text-center text-sm text-slate-400">Loading your inquiries…</p>
      )}
      {!entitlementsLoading && hasAccess && query.isError && (
        <div className="mt-5 rounded-xl border border-rose-300/15 bg-rose-300/[0.05] p-4 text-sm text-slate-300">
          <p>Your inquiry dashboard couldn't be loaded right now.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-white/15 bg-transparent"
            onClick={() => void query.refetch()}
          >
            <RotateCw className="mr-2 h-3.5 w-3.5" />
            Try again
          </Button>
        </div>
      )}
      {!entitlementsLoading && hasAccess && query.data && (
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Total inquiries", value: query.data.total },
            { label: "Unread", value: query.data.unread },
            { label: "Last 30 days", value: query.data.recentTotal },
            { label: "Active conversations", value: query.data.active },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-white/[0.07] bg-[#07170f]/75 p-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {metric.label}
              </p>
              <p className="mt-1 text-xl font-bold text-slate-100">{countLabel(metric.value)}</p>
            </div>
          ))}
        </div>
      )}
      {!entitlementsLoading && hasAccess && query.data?.topListings.length ? (
        <div className="mt-5">
          <h4 className="text-sm font-semibold text-slate-200">Top products by inquiries</h4>
          <div className="mt-2 space-y-2">
            {query.data.topListings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-[#07170f]/65 px-4 py-3"
              >
                <p className="min-w-0 truncate text-sm font-medium text-slate-100">
                  {listing.title}
                </p>
                <div className="shrink-0 text-right text-[11px] text-slate-400">
                  <p>{countLabel(listing.total)} total</p>
                  <p>{countLabel(listing.recent)} in last 30 days</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {!entitlementsLoading &&
        hasAccess &&
        query.data &&
        query.data.recentInquiries.length === 0 && (
          <p className="mt-5 rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-400">
            No customer inquiries have been returned for the last 30 days.
          </p>
        )}
      {!entitlementsLoading && hasAccess && Boolean(query.data?.recentInquiries.length) && (
        <div className="mt-5 space-y-2">
          <h4 className="text-sm font-semibold text-slate-200">Recent customer inquiries</h4>
          {query.data!.recentInquiries.map((inquiry) => (
            <Link
              key={inquiry.chatId}
              to="/messages/$chatId"
              params={{ chatId: inquiry.chatId }}
              className="block rounded-xl border border-white/[0.07] bg-[#07170f]/70 p-4 transition-colors hover:border-emerald-300/25 hover:bg-[#071a11]"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/10 bg-emerald-300/[0.07] text-emerald-300">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {inquiry.product}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {timeLabel(inquiry.lastActivity)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-emerald-200">{inquiry.customer}</p>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">
                    {inquiry.lastMessage}
                  </p>
                  {inquiry.unread !== null && inquiry.unread > 0 && (
                    <span className="mt-2 inline-flex rounded-full bg-emerald-300/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                      {inquiry.unread} unread
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
