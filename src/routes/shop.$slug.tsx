import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/tier-badge";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNaira } from "@/lib/categories";
import { QRCodeSVG } from "qrcode.react";
import { Share2, Phone, MessageCircle, MapPin, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { Star, Send } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/loading-spinner";

export const Route = createFileRoute("/shop/$slug")({
  head: () => ({ meta: [{ title: "Shop — Tile" }] }),
  component: ShopPage,
});

function ShopPage() {
  const { slug } = Route.useParams();

  type Shop = {
    id: string; full_name: string | null; avatar_url: string | null; is_verified: boolean | null;
    business_name?: string | null; shop_slug?: string | null; subscription_tier?: string | null;
    state?: string | null; bio?: string | null; phone?: string | null; whatsapp?: string | null;
    portfolio_images?: string[] | null;
  };
  const { data: shop, isLoading } = useQuery<Shop | null>({
    queryKey: ["shop", slug],
    queryFn: async () => {
      const { data } = await (supabase.from("public_profiles") as unknown as { select: (c: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: Shop | null }> } } })
        .select("*").eq("shop_slug", slug).maybeSingle();
      return data ?? null;
    },
  });

  const { data: listings = [] } = useQuery({
    queryKey: ["shop-listings", shop?.id],
    enabled: !!shop?.id,
    queryFn: async () => {
      const { data } = await supabase.from("listings")
        .select("id,title,price,type,location,images,is_promoted,category")
        .eq("user_id", shop!.id!).eq("status", "approved").order("is_promoted", { ascending: false });
      return (data ?? []) as ListingCardData[];
    },
  });

  const services = listings.filter((l) => l.type === "service");
  const goods = listings.filter((l) => l.type === "goods");

  if (isLoading) return <div className="min-h-screen bg-background"><SiteHeader /><LoadingSpinner label="Loading shop…" /></div>;
  if (!shop) return <div className="min-h-screen bg-background"><SiteHeader /><div className="container py-12">Shop not found.</div></div>;

  const url = typeof window !== "undefined" ? window.location.href : "";
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: shop.business_name ?? shop.full_name ?? "Shop", url });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-6 grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground grid place-items-center text-2xl font-bold">
              {(shop.business_name ?? shop.full_name ?? "S")[0]}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {shop.business_name ?? shop.full_name}
                {shop.is_verified && <BadgeCheck className="h-5 w-5 text-accent" />}
                <TierBadge tier={shop.subscription_tier} />
              </h1>
              {shop.state && <p className="text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-4 w-4" />{shop.state}</p>}
              {shop.bio && <p className="mt-3 text-foreground/90">{shop.bio}</p>}
              <div className="flex gap-2 mt-4 flex-wrap">
                <Button onClick={share} variant="outline"><Share2 className="h-4 w-4 mr-1" />Share</Button>
                {shop.phone && <Button className="bg-accent text-accent-foreground"><Phone className="h-4 w-4 mr-1" />{shop.phone}</Button>}
                {shop.whatsapp && <Button asChild variant="outline"><a href={`https://wa.me/${shop.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</a></Button>}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">Scan to visit shop</p>
          <div className="bg-white p-3 rounded-lg inline-block">
            <QRCodeSVG value={url} size={144} />
          </div>
          <p className="text-xs text-muted-foreground mt-3 break-all">{url}</p>
        </Card>
      </div>

      <section className="container mx-auto px-4 pb-12">
        <Tabs defaultValue="listings">
          <TabsList>
            <TabsTrigger value="listings">Active Listings ({goods.length})</TabsTrigger>
            <TabsTrigger value="portfolio">Work Portfolio ({services.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="listings" className="mt-4">
            {goods.length === 0 ? <p className="text-muted-foreground">No goods listed yet.</p> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {goods.map((l) => <ListingCard key={l.id} l={l} />)}
              </div>
            )}
          </TabsContent>
          <TabsContent value="portfolio" className="mt-4">
            {services.length === 0 ? <p className="text-muted-foreground">No portfolio entries yet.</p> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {services.map((l) => (
                  <div key={l.id} className="rounded-lg overflow-hidden border border-border bg-card">
                    <div className="aspect-square bg-muted" />
                    <div className="p-3"><p className="text-sm font-medium line-clamp-2">{l.title}</p><p className="text-xs text-muted-foreground">{l.location}</p></div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        <p className="text-xs text-muted-foreground mt-6">Total inventory value: {formatNaira(listings.reduce((s, l) => s + (l.price ?? 0), 0))}</p>
        <Link to="/" className="text-accent text-sm block mt-2">← Back to marketplace</Link>
      </section>
      {shop.id && <ShopReviews shopId={shop.id} />}
    </div>
  );
}

function ShopReviews({ shopId }: { shopId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: reviews = [] } = useQuery({
    queryKey: ["shop-reviews", shopId],
    queryFn: async () => {
      const { data } = await supabase.from("shop_reviews").select("*").eq("shop_user_id", shopId).order("created_at", { ascending: false });
      return (data ?? []) as Array<{ id: string; reviewer_id: string; rating: number; comment: string | null; created_at: string }>;
    },
  });
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const mine = user ? reviews.find((r) => r.reviewer_id === user.id) : null;
  const isOwn = user?.id === shopId;

  const submit = async () => {
    if (!user) return toast.error("Sign in to leave a review");
    if (isOwn) return toast.error("You can't review your own shop");
    if (rating < 1) return toast.error("Please pick a star rating between 1 and 5");
    if (comment.length > 1000) return toast.error("Comment too long (max 1000 chars)");
    setBusy(true);
    const { error } = await supabase.from("shop_reviews").upsert({
      shop_user_id: shopId, reviewer_id: user.id, rating, comment: comment || null,
    }, { onConflict: "shop_user_id,reviewer_id" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(mine ? "Review updated" : "Review posted");
    setRating(0); setComment("");
    qc.invalidateQueries({ queryKey: ["shop-reviews", shopId] });
  };

  return (
    <section className="container mx-auto px-4 pb-12">
      <Card className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold">Shop reviews</h2>
          <div className="flex items-center gap-2">
            <div className="flex">{[1,2,3,4,5].map((n) => (
              <Star key={n} className={`h-5 w-5 ${n <= Math.round(avg) ? "fill-accent text-accent" : "text-muted-foreground"}`} />
            ))}</div>
            <span className="font-bold">{avg.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({reviews.length} review{reviews.length === 1 ? "" : "s"})</span>
          </div>
        </div>

        {user && !isOwn && (
          <div className="mt-4 p-4 rounded border space-y-2 bg-muted/30">
            <p className="text-sm font-medium">{mine ? "Update your review" : "Leave a review"}</p>
            <div className="flex gap-1">{[1,2,3,4,5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
                <Star className={`h-7 w-7 ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
              </button>
            ))}</div>
            <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience (optional)" />
            <Button onClick={submit} disabled={busy} className="bg-accent text-accent-foreground">
              <Send className="h-4 w-4 mr-1" />{busy ? "Sending…" : "Submit review"}
            </Button>
          </div>
        )}
        {!user && <p className="text-sm text-muted-foreground mt-3">Sign in to leave a review.</p>}
        {isOwn && <p className="text-sm text-muted-foreground mt-3">You can't review your own shop.</p>}

        <div className="mt-6 space-y-3">
          {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>}
          {reviews.map((r) => (
            <div key={r.id} className="border-b last:border-0 pb-3">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((n) => (
                  <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                ))}
                <span className="text-xs text-muted-foreground ml-2">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              {r.comment && <p className="text-sm mt-1">{r.comment}</p>}
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}