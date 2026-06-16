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
import { Store } from "lucide-react";

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
      return { ...row, profile: prof } as any;
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

  // Track view once per mount
  useEffect(() => {
    if (listing?.id) {
      supabase.rpc("track_listing_view", { _id: listing.id });
    }
  }, [listing?.id]);

  useEffect(() => {
    if (!user || !listing) return;
    supabase.from("favorites").select("user_id").eq("user_id", user.id).eq("listing_id", listing.id).maybeSingle()
      .then(({ data }) => setFavored(!!data));
  }, [user, listing]);

  const toggleFav = async () => {
    if (!user || !listing) return toast.error("Sign in to save");
    if (favored) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", listing.id);
      setFavored(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, listing_id: listing.id });
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
      <div className="container mx-auto px-4 py-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Gallery */}
          <Card className="overflow-hidden p-0 relative">
            <div className="relative aspect-video bg-muted">
              {imgUrls.length ? (
                <img src={imgUrls[imgIdx]} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-muted-foreground">No images</div>
              )}
              {imgUrls.length > 1 && (
                <>
                  <button onClick={() => setImgIdx((i) => Math.max(0, i - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-2"><ChevronLeft /></button>
                  <button onClick={() => setImgIdx((i) => Math.min(imgUrls.length - 1, i + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-2"><ChevronRight /></button>
                </>
              )}
            </div>
            {imgUrls.length > 1 && (
              <div className="flex gap-2 p-2 overflow-x-auto">
                {imgUrls.map((u, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={`h-16 w-16 shrink-0 rounded border-2 ${i === imgIdx ? "border-accent" : "border-transparent"}`}>
                    <img src={u} alt="" className="w-full h-full object-cover rounded" />
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge className="bg-primary text-primary-foreground capitalize mb-2">{listing.type}</Badge>
                <h1 className="text-2xl font-bold">{listing.title}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-4 w-4" />{listing.location}</p>
              </div>
              <p className="text-3xl font-extrabold text-accent">{formatNaira(listing.price)}</p>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-foreground/90">{listing.description}</p>
            <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
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

          {/* Milestone reviews */}
          <Card className="p-5">
            <h2 className="text-lg font-semibold mb-3">Milestone reviews</h2>
            {avg ? (
              <div className="grid grid-cols-3 gap-3">
                <Metric label="Communication" value={avg.comm} />
                <Metric label="Timeliness" value={avg.time} />
                <Metric label="Work quality" value={avg.qual} />
              </div>
            ) : <p className="text-muted-foreground text-sm">No reviews yet.</p>}
          </Card>
        </div>

        {/* Sticky sidebar */}
        <aside className="lg:sticky lg:top-24 h-fit space-y-3">
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold">
                {(listing.profile?.full_name ?? "U")[0]}
              </div>
              <div>
                <p className="font-semibold flex items-center gap-1">
                  {listing.profile?.full_name ?? "Vendor"}
                  {listing.profile?.is_verified && <Badge className="bg-accent text-accent-foreground ml-1">Verified</Badge>}
                </p>
              </div>
            </div>
            <Button onClick={() => { setShowPhone(true); if (listing.id) supabase.rpc("track_listing_click", { _id: listing.id }); }} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              <Phone className="h-4 w-4 mr-2" />{showPhone ? listing.phone : "Reveal phone number"}
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
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><p className="text-muted-foreground text-xs uppercase">{label}</p><p className="font-medium capitalize">{value || "—"}</p></div>;
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted">
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="text-2xl font-bold text-accent flex items-center justify-center gap-1"><Star className="h-4 w-4 fill-current" />{value.toFixed(1)}</p>
    </div>
  );
}

function ChatWithVendorButton({ listingId, sellerId }: { listingId: string; sellerId: string }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  const start = async () => {
    if (!user) { nav({ to: "/auth" }); return; }
    if (user.id === sellerId) { toast.error("You cannot chat with yourself"); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("ensure_chat" as never, { _listing_id: listingId } as never);
    setBusy(false);
    if (error || !data) return toast.error(error?.message ?? "Could not open chat");
    nav({ to: "/messages/$chatId", params: { chatId: data as unknown as string } });
  };

  return (
    <Button variant="outline" className="w-full" onClick={start} disabled={busy}>
      <MessageCircle className="h-4 w-4 mr-2" />
      {user ? (busy ? "Opening…" : "Chat with vendor") : "Sign in to chat"}
    </Button>
  );
}
