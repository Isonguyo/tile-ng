import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, MessageCircle, Heart, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { getSignedUrls } from "@/lib/storage";
import { formatNaira } from "@/lib/categories";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { showError } from "@/lib/user-feedback";
import { Store, ShieldCheck } from "lucide-react";
import { rpcUntyped } from "@/lib/waitlist-rpc";

export const Route = createFileRoute("/listing/$id")({
  component: ListingDetail,
});

function ListingDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [imgIdx, setImgIdx] = useState(0);
  const [imgUrls, setImgUrls] = useState<string[]>([]);
  const [showPhone, setShowPhone] = useState(false);
  const [favored, setFavored] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id, !!user],
    queryFn: async () => {
      const cols = "id,user_id,type,title,description,category,location,price,images,status,is_promoted,condition,brand,years_experience,service_mode,created_at,updated_at";
      const { data, error } = await supabase
        .from("listings")
        .select((user ? cols + ",phone" : cols) as "*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as Record<string, unknown> & { user_id: string };
      const { data: prof } = await supabase
        .from("public_profiles")
        .select("full_name, avatar_url, is_verified, shop_slug, subscription_tier")
        .eq("id", row.user_id)
        .maybeSingle();
      const { data: trust } = await rpcUntyped("seller_trust_score", { _uid: row.user_id });
      return { ...row, profile: prof, trust_score: typeof trust === "number" ? trust : null } as any;
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data } = await supabase.from("reviews").select("*").eq("listing_id", id);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (listing?.images?.length) getSignedUrls(listing.images).then(setImgUrls);
  }, [listing]);

  useEffect(() => {
  if (!listing?.id) return;

  const trackView = async () => {
    const { error } = await supabase.rpc("track_listing_event", {
      p_listing_id: listing.id,
      p_event_type: "view",
    });

    if (error) {
      console.error("View tracking error:", error);
    } else {
      console.log("View tracked successfully");
    }
  };

  trackView();
}, [listing?.id]);

  useEffect(() => {
    if (!user || !listing) return;
    supabase.from("favorites").select("user_id").eq("user_id", user.id).eq("listing_id", listing.id).maybeSingle()
      .then(({ data }) => setFavored(!!data));
  }, [user, listing]);

  const toggleFav = async () => {
  if (!user || !listing) return toast.error("Sign in to save");

  if (favored) {
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listing.id);

    setFavored(false);
  } else {
    const { error } = await supabase
      .from("favorites")
      .insert({
        user_id: user.id,
        listing_id: listing.id,
      });

    if (!error) {
      await supabase.rpc("track_listing_event", {
        p_listing_id: listing.id,
        p_event_type: "save",
      });
    }

    setFavored(true);
  }
};

  if (isLoading) return <div className="min-h-screen bg-background"><SiteHeader /><div className="container mx-auto py-12">Loading…</div></div>;
  if (!listing) return <div className="min-h-screen bg-background"><SiteHeader /><div className="container mx-auto py-12">Not found</div></div>;

  const avg = reviews.length
    ? {
      comm: reviews.reduce((s, r) => s + r.communication, 0) / reviews.length,
      time: reviews.reduce((s, r) => s + r.timeliness, 0) / reviews.length,
      qual: reviews.reduce((s, r) => s + r.work_quality, 0) / reviews.length,
    }
    : null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto grid w-full max-w-6xl min-w-0 grid-cols-1 gap-4 px-3 py-4 sm:gap-6 sm:px-4 sm:py-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="min-w-0 space-y-4">
          {/* Gallery */}
          <Card className="relative min-w-0 overflow-hidden p-0">
            <div className="relative aspect-[4/3] bg-muted sm:aspect-video">
              {imgUrls.length ? (
                <img src={imgUrls[imgIdx]} alt={listing.title} decoding="async" fetchPriority="high" className="h-full w-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-muted-foreground">No images</div>
              )}
              {imgUrls.length > 1 && (
                <>
                  <button type="button" aria-label="Previous photo" onClick={() => setImgIdx((i) => Math.max(0, i - 1))} className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/65 text-white shadow-lg backdrop-blur-sm"><ChevronLeft className="h-5 w-5" /></button>
                  <button type="button" aria-label="Next photo" onClick={() => setImgIdx((i) => Math.min(imgUrls.length - 1, i + 1))} className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/65 text-white shadow-lg backdrop-blur-sm"><ChevronRight className="h-5 w-5" /></button>
                </>
              )}
            </div>
            {imgUrls.length > 1 && (
              <div className="flex min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto p-2">
                {imgUrls.map((u, i) => (
                  <button key={i} type="button" aria-label={`Show photo ${i + 1}`} onClick={() => setImgIdx(i)} className={`h-14 w-14 shrink-0 snap-start rounded-lg border-2 sm:h-16 sm:w-16 ${i === imgIdx ? "border-accent" : "border-transparent"}`}>
                    <img src={u} alt="" loading="lazy" decoding="async" className="h-full w-full rounded-md object-cover" />
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="min-w-0 p-4 sm:p-6">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <Badge className="bg-primary text-primary-foreground capitalize mb-2">{listing.type}</Badge>
                <h1 className="break-words [overflow-wrap:anywhere] text-xl font-bold sm:text-2xl">{listing.title}</h1>
                <p className="mt-1 flex min-w-0 items-start gap-1 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span className="min-w-0 [overflow-wrap:anywhere]">{listing.location}</span></p>
              </div>
              <p className="max-w-full break-words text-2xl font-extrabold text-accent sm:shrink-0 sm:text-3xl">{formatNaira(listing.price)}</p>
            </div>
            <p className="mt-4 whitespace-pre-wrap [overflow-wrap:anywhere] text-sm leading-6 text-foreground/90 sm:text-base">{listing.description}</p>
            <div className="mt-5 grid min-w-0 grid-cols-2 gap-3 text-sm">
              {listing.type === "goods" ? (
                <>
                  <Spec label="Brand" value={listing.brand} />
                  <Spec label="Condition" value={listing.condition?.replace("_", " ")} />
                </>
              ) : (
                <>
                  <Spec label="Experience" value={listing.years_experience ? `${listing.years_experience} yrs` : null} />
                  <Spec label="Mode" value={listing.service_mode} />
                </>
              )}
            </div>
          </Card>

        </main>

        {/* Keep seller actions near the listing on phones; pin them beside it on desktop. */}
        <aside className="h-fit min-w-0 lg:sticky lg:top-24">
          <Card className="space-y-3 p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground">
                {(listing.profile?.full_name ?? "U")[0]}
              </div>
              <div className="min-w-0">
                <p className="flex min-w-0 flex-wrap items-center gap-1 font-semibold">
                  <span className="break-words">{listing.profile?.full_name ?? "Vendor"}</span>
                  {listing.profile?.is_verified && <Badge className="bg-accent text-accent-foreground">Verified</Badge>}
                </p>
                {typeof listing.trust_score === "number" && (
                  <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Trust score <span className="font-semibold text-foreground">{listing.trust_score}/100</span>
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={() => {
                setShowPhone(true);

                if (listing.id) {
                  supabase.rpc("track_listing_event", {
                    p_listing_id: listing.id,
                    p_event_type: "phone",
                  });
                }
              }} className="min-h-11 w-full whitespace-normal break-all bg-accent text-accent-foreground hover:bg-accent/90">
              <Phone className="mr-2 h-4 w-4 shrink-0" />{showPhone ? listing.phone || "Phone unavailable" : "Reveal phone number"}
            </Button>
            {listing.profile?.shop_slug && (
              <Button asChild variant="outline" className="w-full">
                <Link to="/shop/$slug" params={{ slug: listing.profile.shop_slug }}>
                  <Store className="h-4 w-4 mr-2" />Visit seller's shop
                </Link>
              </Button>
            )}
            <ChatWithVendorButton listingId={listing.id} sellerId={listing.user_id} />
            <Button variant="outline" onClick={toggleFav} className="w-full">
              <Heart className={`h-4 w-4 mr-2 ${favored ? "fill-accent text-accent" : ""}`} />
              {favored ? "Saved" : "Save"}
            </Button>
          </Card>
        </aside>

        {/* Reviews follow the seller actions on mobile and span the page on desktop. */}
        <Card className="min-w-0 p-4 sm:p-5 lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Milestone reviews</h2>
          {avg ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
              <Metric label="Communication" value={avg.comm} />
              <Metric label="Timeliness" value={avg.time} />
              <Metric label="Work quality" value={avg.qual} />
            </div>
          ) : <p className="text-muted-foreground text-sm">No reviews yet.</p>}
        </Card>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><p className="text-muted-foreground text-xs uppercase">{label}</p><p className="font-medium capitalize">{value || "—"}</p></div>;
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-lg bg-muted p-3 text-center">
      <p className="break-words text-[10px] uppercase text-muted-foreground sm:text-xs">{label}</p>
      <p className="mt-1 flex items-center justify-center gap-1 text-2xl font-bold text-accent"><Star className="h-4 w-4 fill-current" />{value.toFixed(1)}</p>
    </div>
  );
}

function ChatWithVendorButton({ listingId, sellerId }: { listingId: string; sellerId: string }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

 const start = async () => {
  if (!user) {
    nav({ to: "/auth" });
    return;
  }

  if (user.id === sellerId) {
    toast.error("You cannot chat with yourself");
    return;
  }

  setBusy(true);

  const { data, error } = await supabase.rpc(
    "ensure_chat" as never,
    { _listing_id: listingId } as never
  );

  if (error || !data) {
    setBusy(false);
    return showError(error, "We couldn't open this conversation. Please try again.");
  }

  // ✅ Record chat analytics
  const { error: trackError } = await supabase.rpc("track_listing_event", {
    p_listing_id: listingId,
    p_event_type: "chat",
  });

  if (trackError) {
    console.error("Chat tracking failed:", trackError);
  }

  setBusy(false);

  nav({
    to: "/messages/$chatId",
    params: {
      chatId: data as unknown as string,
    },
  });
};

  return (
    <Button variant="outline" className="w-full" onClick={start} disabled={busy}>
      <MessageCircle className="h-4 w-4 mr-2" />
      {user ? (busy ? "Opening…" : "Chat with vendor") : "Sign in to chat"}
    </Button>
  );
}
