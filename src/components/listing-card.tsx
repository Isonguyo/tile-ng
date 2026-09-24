import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, ImageIcon, Eye, MousePointerClick, BadgeCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getSignedUrl } from "@/lib/storage";
import { formatNaira } from "@/lib/categories";

export type ListingCardData = {
  id: string;
  title: string;
  price: number | null;
  type: "goods" | "service";
  location: string;
  images: string[];
  is_promoted: boolean;
  category: string;
  description?: string | null;
  views_count?: number | null;
  clicks_count?: number | null;
  seller_tier?: string | null;
  seller_verified?: boolean | null;
  seller_trust?: number | null;
};

export function ListingCard({ l }: { l: ListingCardData }) {
  const [url, setUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (l.images[0]) getSignedUrl(l.images[0]).then(setUrl);
  }, [l.images]);

  useEffect(() => {
    const card = cardRef.current;

    if (!card) return;

    let tracked = false;
    let visibilityTimer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (tracked) return;

        const isVisibleEnough =
          entry.isIntersecting && entry.intersectionRatio >= 0.5;

        if (isVisibleEnough) {
          if (visibilityTimer) return;

          visibilityTimer = setTimeout(async () => {
            if (tracked) return;

            tracked = true;

            const { error } = await supabase.rpc("track_listing_event", {
              p_listing_id: l.id,
              p_event_type: "impression",
            });

            if (error) {
              console.error("Impression tracking error:", error);
              tracked = false;
            } else {
              console.log("Impression tracked:", l.id);
              observer.disconnect();
            }

            visibilityTimer = null;
          }, 1000);
        } else if (visibilityTimer) {
          clearTimeout(visibilityTimer);
          visibilityTimer = null;
        }
      },
      {
        threshold: [0, 0.5, 1],
      }
    );

    observer.observe(card);

    return () => {
      if (visibilityTimer) {
        clearTimeout(visibilityTimer);
      }

      observer.disconnect();
    };
  }, [l.id]);
  return (
    <Link to="/listing/$id" params={{ id: l.id }} className="block group">
      <Card
        ref={cardRef}
        className="overflow-hidden border-border hover:shadow-lg transition-all hover:-translate-y-0.5 p-0"
      >
        <div className="relative aspect-[4/3] bg-muted">
          {url ? (
            <img src={url} alt={l.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full grid place-items-center text-muted-foreground"><ImageIcon className="h-10 w-10" /></div>
          )}
          {l.is_promoted && (
            <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground"><Star className="h-3 w-3 mr-1" />Promoted</Badge>
          )}
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground capitalize">{l.type}</Badge>
          {(l.seller_tier && l.seller_tier !== "free") && (
            <Badge className="absolute bottom-2 left-2 bg-emerald-600 text-white gap-1 capitalize">
              <BadgeCheck className="h-3 w-3" />Verified {l.seller_tier === "lite" ? "Vendor" : l.seller_tier}
            </Badge>
          )}
        </div>
        <div className="p-3 space-y-1">
          <h3 className="font-medium line-clamp-2 text-sm group-hover:text-accent">{l.title}</h3>
          {l.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{l.description}</p>
          )}
          <div className="flex items-center justify-between gap-2">
            <p className="text-accent font-bold text-lg">{formatNaira(l.price)}</p>
            {typeof l.seller_trust === "number" && (
              <span
                title="Seller trust score"
                className={`flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${l.seller_trust >= 70 ? "border-primary/40 text-primary" : l.seller_trust >= 40 ? "border-border text-muted-foreground" : "border-destructive/40 text-destructive"}`}
              >
                <ShieldCheck className="h-3 w-3" />{l.seller_trust}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{l.location}</span>
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{l.views_count ?? 0}</span>
              <span className="flex items-center gap-0.5"><MousePointerClick className="h-3 w-3" />{l.clicks_count ?? 0}</span>
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}