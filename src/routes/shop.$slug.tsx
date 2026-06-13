import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/tier-badge";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { formatNaira } from "@/lib/categories";
import { QRCodeSVG } from "qrcode.react";
import { Share2, Phone, MessageCircle, MapPin, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

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

  if (isLoading) return <div className="min-h-screen bg-background"><SiteHeader /><div className="container py-12">Loading…</div></div>;
  if (!shop) return <div className="min-h-screen bg-background"><SiteHeader /><div className="container py-12">Shop not found.</div></div>;

  const url = typeof window !== "undefined" ? window.location.href : "";
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: shop.business_name ?? shop.full_name, url });
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
        <h2 className="text-lg font-semibold mb-4">Listings ({listings.length})</h2>
        {listings.length === 0 ? <p className="text-muted-foreground">No listings yet.</p> : (
          <div className="columns-2 sm:columns-3 md:columns-4 gap-4 [column-fill:_balance]">
            {listings.map((l) => (
              <div key={l.id} className="mb-4 break-inside-avoid"><ListingCard l={l} /></div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-6">Total inventory value: {formatNaira(listings.reduce((s, l) => s + (l.price ?? 0), 0))}</p>
        <Link to="/" className="text-accent text-sm">← Back to marketplace</Link>
      </section>
    </div>
  );
}