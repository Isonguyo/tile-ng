import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, ImageIcon, Eye, MousePointerClick, BadgeCheck } from "lucide-react";
import { useEffect, useState } from "react";
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
};

export function ListingCard({ l }: { l: ListingCardData }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (l.images[0]) getSignedUrl(l.images[0]).then(setUrl);
  }, [l.images]);

  return (
    <Link to="/listing/$id" params={{ id: l.id }} className="block group">
      <Card className="overflow-hidden border-border hover:shadow-lg transition-all hover:-translate-y-0.5 p-0">
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
          <p className="text-accent font-bold text-lg">{formatNaira(l.price)}</p>
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