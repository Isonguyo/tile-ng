import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Copy, ExternalLink, Facebook, Link2, MessageCircle, Share2, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { rpcUntyped } from "@/lib/waitlist-rpc";

type ShareListing = {
  id: string;
  title: string;
  status: string;
  is_prelaunch?: boolean | null;
  expires_at?: string | null;
};

async function copyLink(url: string) {
  await navigator.clipboard.writeText(url);
}

export function SocialSharingTools({
  userId,
  shopSlug,
  listings,
  hasAccess,
  entitlementsLoading = false,
}: {
  userId: string;
  shopSlug?: string | null;
  listings: ShareListing[];
  hasAccess: boolean;
  entitlementsLoading?: boolean;
}) {
  const qc = useQueryClient();
  const publicListings = listings.filter(
    (listing) =>
      listing.status === "approved" &&
      listing.is_prelaunch !== true &&
      (!listing.expires_at || new Date(listing.expires_at).getTime() > Date.now()),
  );
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const shopUrl = shopSlug ? `${origin}/shop/${shopSlug}` : null;

  const trackListingShare = (listingId: string, eventTypes: Array<"share" | "whatsapp">) => {
    void Promise.allSettled(
      eventTypes.map((eventType) =>
        rpcUntyped("track_listing_event", { p_listing_id: listingId, p_event_type: eventType }),
      ),
    ).finally(() => void qc.invalidateQueries({ queryKey: ["vendor-analytics", userId] }));
  };

  const copyListing = async (listing: ShareListing) => {
    const url = `${origin}/listing/${listing.id}`;
    try {
      await copyLink(url);
      trackListingShare(listing.id, ["share"]);
      toast.success("Listing link copied");
    } catch {
      toast.error("Couldn't copy the link. Please try again.");
    }
  };

  const shareListing = async (listing: ShareListing) => {
    const url = `${origin}/listing/${listing.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, url });
      } else {
        await copyLink(url);
        toast.success("Listing link copied");
      }
      trackListingShare(listing.id, ["share"]);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error("Couldn't share this listing right now.");
    }
  };

  const openListingShare = (listing: ShareListing, channel: "whatsapp" | "facebook" | "x") => {
    const url = `${origin}/listing/${listing.id}`;
    const text = `${listing.title} on Tile`;
    const destination =
      channel === "whatsapp"
        ? `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`
        : channel === "facebook"
          ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
          : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    trackListingShare(listing.id, channel === "whatsapp" ? ["share", "whatsapp"] : ["share"]);
    window.open(destination, "_blank", "noopener,noreferrer");
  };

  const shareShop = async () => {
    if (!shopUrl) return;
    try {
      if (navigator.share) await navigator.share({ title: "My Tile shop", url: shopUrl });
      else {
        await copyLink(shopUrl);
        toast.success("Shop link copied");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error("Couldn't share your shop right now.");
    }
  };

  const copyShop = async () => {
    if (!shopUrl) return;
    try {
      await copyLink(shopUrl);
      toast.success("Shop link copied");
    } catch {
      toast.error("Couldn't copy your shop link. Please try again.");
    }
  };

  return (
    <Card
      id="social-sharing"
      className="overflow-hidden border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] p-5 text-slate-100 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-300">
          <Share2 className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            Seller growth tools
          </p>
          <h3 className="mt-1 text-lg font-semibold">Social sharing toolkit</h3>
          <p className="mt-1 text-sm text-slate-400">
            Share public listings or your shop directly with customers.
          </p>
        </div>
      </div>

      {entitlementsLoading && (
        <p className="mt-5 animate-pulse rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-sm text-slate-400">
          Checking plan access…
        </p>
      )}
      {!entitlementsLoading && !hasAccess && (
        <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-black/10 p-4">
          <p className="text-sm font-medium text-slate-200">Available with Pro and VIP</p>
          <p className="mt-1 text-xs text-slate-500">
            Share listing and shop links with your customers.
          </p>
          <Button asChild size="sm" className="mt-3 bg-[#35d879] text-[#04120a] hover:bg-[#52e98f]">
            <a href="#billing">Compare plans</a>
          </Button>
        </div>
      )}
      {!entitlementsLoading && hasAccess && (
        <>
          {shopUrl ? (
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#07170f]/65 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Store className="h-4 w-4 text-emerald-300" />
                  Your shop link
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">{shopUrl}</p>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void copyShop()}
                    className="border-white/15 bg-transparent text-slate-100"
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void shareShop()}
                    className="bg-[#35d879] text-[#04120a] hover:bg-[#52e98f]"
                  >
                    <Share2 className="mr-1.5 h-3.5 w-3.5" />
                    Share shop
                  </Button>
                </div>
                <a
                  href="#shop-qr"
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-200 hover:text-emerald-100"
                >
                  Use your existing shop QR code
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
              Set up your shop URL to share your full storefront.
            </p>
          )}

          <div className="mt-5">
            <h4 className="text-sm font-semibold text-slate-200">Share a public listing</h4>
            {publicListings.length === 0 ? (
              <p className="mt-2 rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
                Approved public listings will appear here when they are ready to share.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {publicListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#07170f]/65 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <p className="min-w-0 truncate text-sm font-medium text-slate-100">
                      {listing.title}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void copyListing(listing)}
                        className="border-white/15 bg-transparent text-slate-100"
                      >
                        <Link2 className="mr-1.5 h-3.5 w-3.5" />
                        Copy link
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void shareListing(listing)}
                        className="border-white/15 bg-transparent text-slate-100"
                      >
                        <Share2 className="mr-1.5 h-3.5 w-3.5" />
                        Share
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openListingShare(listing, "whatsapp")}
                        className="border-emerald-300/20 bg-emerald-300/[0.05] text-emerald-100"
                      >
                        <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openListingShare(listing, "facebook")}
                        className="border-white/15 bg-transparent text-slate-100"
                      >
                        <Facebook className="mr-1.5 h-3.5 w-3.5" />
                        Facebook
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openListingShare(listing, "x")}
                        className="border-white/15 bg-transparent text-slate-100"
                      >
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />X
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
