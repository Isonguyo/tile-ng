import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Star,
  ImageIcon,
  Eye,
  MousePointerClick,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSignedUrl } from "@/lib/storage";
import { formatNaira } from "@/lib/categories";
import { rpcUntyped } from "@/lib/waitlist-rpc";
import { hasVerifiedVendorBadge } from "@/lib/vendor-badges";

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
  seller_id?: string | null;
  seller_trust?: number | null;
};

export function ListingCard({ l }: { l: ListingCardData }) {
  const [url, setUrl] = useState<string | null>(null);
  const [cardVisible, setCardVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const { data: hasVendorBadge = false } = useQuery({
    queryKey: ["vendor-badges", l.seller_id],
    enabled: !!l.seller_id && cardVisible,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("get_vendor_badges", { _user_id: l.seller_id });
      if (error) throw error;
      return hasVerifiedVendorBadge(data);
    },
  });

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
        if (entry.isIntersecting) setCardVisible(true);

        const isVisibleEnough = entry.isIntersecting && entry.intersectionRatio >= 0.5;

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
      { threshold: [0, 0.5, 1] },
    );

    observer.observe(card);

    return () => {
      if (visibilityTimer) clearTimeout(visibilityTimer);
      observer.disconnect();
    };
  }, [l.id]);

  return (
    <Link to="/listing/$id" params={{ id: l.id }} className="block group">
      <Card
        ref={cardRef}
        className="overflow-hidden rounded-2xl bg-[#081810] border border-[#163321] hover:border-[#22C55E]/50 hover:shadow-[0_8px_30px_rgba(34,197,94,0.12)] transition-all duration-300 p-0"
      >
        {/* Image Container */}
        <div className="relative aspect-[4/3] bg-[#05100B] overflow-hidden">
          {url ? (
            <img
              src={url}
              alt={l.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-[#22C55E]/20">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}

          {/* Promoted Tag */}
          {l.is_promoted && (
            <Badge className="absolute top-3 left-3 bg-[#22C55E] hover:bg-[#16A34A] text-[#05100B] font-bold shadow-lg border-none px-2.5 py-1 rounded-md gap-1 text-xs">
              <Star className="h-3 w-3 fill-[#05100B]" /> Top Pick
            </Badge>
          )}

          {/* Listing Type Tag */}
          <Badge className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-[#E2F0E9] border border-[#22C55E]/20 font-medium text-xs px-2.5 py-1 rounded-md capitalize">
            {l.type}
          </Badge>

          {/* Verified Seller Tag */}
          {hasVendorBadge && (
            <Badge className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md border border-[#22C55E]/40 text-[#22C55E] font-medium px-2.5 py-1 rounded-md gap-1.5 text-[11px] shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verified Vendor
            </Badge>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-2.5">
          <h3 className="font-semibold text-slate-100 line-clamp-1 text-base group-hover:text-[#22C55E] transition-colors">
            {l.title}
          </h3>

          {l.description && <p className="text-xs text-slate-400 line-clamp-1">{l.description}</p>}

          {/* Price & Trust Score */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="text-[#22C55E] font-bold text-lg tracking-tight">
              {formatNaira(l.price)}
            </p>
            {typeof l.seller_trust === "number" && (
              <span
                title="Seller trust score"
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border bg-[#05100B] ${
                  l.seller_trust >= 70
                    ? "border-[#22C55E]/30 text-[#22C55E]"
                    : l.seller_trust >= 40
                      ? "border-slate-700 text-slate-300"
                      : "border-red-500/30 text-red-400"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {l.seller_trust}%
              </span>
            )}
          </div>

          {/* Location & Analytics Footer */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-[#163321]">
            <span className="flex items-center gap-1 truncate max-w-[140px] group-hover:text-slate-300 transition-colors">
              <MapPin className="h-3.5 w-3.5 text-[#22C55E] shrink-0" />
              <span className="truncate">{l.location}</span>
            </span>
            <span className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 text-slate-500" />
                {l.views_count ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <MousePointerClick className="h-3.5 w-3.5 text-slate-500" />
                {l.clicks_count ?? 0}
              </span>
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
