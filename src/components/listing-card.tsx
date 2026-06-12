import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, ImageIcon } from "lucide-react";
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
        </div>
        <div className="p-3 space-y-1">
          <h3 className="font-medium line-clamp-2 text-sm group-hover:text-accent">{l.title}</h3>
          <p className="text-accent font-bold text-lg">{formatNaira(l.price)}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{l.location}</p>
        </div>
      </Card>
    </Link>
  );
}