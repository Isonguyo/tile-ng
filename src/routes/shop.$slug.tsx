import { rpcUntyped } from "@/lib/waitlist-rpc";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/tier-badge";
import { type ListingCardData } from "@/components/listing-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNaira } from "@/lib/categories";
import { QRCodeSVG } from "qrcode.react";
import { useState, useMemo, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { showError } from "@/lib/user-feedback";
import {
  Share2, Phone, MessageCircle, MapPin, BadgeCheck, Star, Send,
  Search, SlidersHorizontal, Package, Users, Heart, Eye, TrendingUp,
  Award, Zap, Flame, Trophy, CheckCircle2, Bookmark, ChevronLeft, ChevronRight
} from "lucide-react";

export const Route = createFileRoute("/shop/$slug")({
  head: () => ({ meta: [{ title: "Shop — Tile" }],
  links: [
      {
        rel: "icon",
        href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg",
      },
    ],
   }),
  component: ShopPage,
});

type ShopListing = ListingCardData & { views_count?: number | null; clicks_count?: number | null };

function ShopPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [bannerIdx, setBannerIdx] = useState(0);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [following, setFollowing] = useState<boolean>(false);
  const [followBusy, setFollowBusy] = useState(false);

  type Shop = {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
    business_name?: string | null;
    shop_slug?: string | null;
    subscription_tier?: string | null;
    state?: string | null;
    bio?: string | null;
    portfolio_images?: string[] | null;
    created_at?: string | null;
  };

  const { data: shop, isLoading } = useQuery<Shop | null>({
    queryKey: ["shop", slug],
    queryFn: async () => {
      const { data } = await (supabase.from("public_profiles") as unknown as { select: (c: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: Shop | null }> } } })
        .select("*").eq("shop_slug", slug).maybeSingle();
      return data ?? null;
    },
  });

  const { data: contact } = useQuery<{ phone: string | null; whatsapp: string | null } | null>({
    queryKey: ["shop-contact", slug, !!user],
    enabled: !!user && !!shop?.id,
    queryFn: async () => {
      const { data } = await supabase.rpc("shop_contact" as never, { _slug: slug } as never);
      const row = (Array.isArray(data) ? data[0] : data) as { phone: string | null; whatsapp: string | null } | null;
      return row ?? null;
    },
  });

  const { data: listings = [] } = useQuery({
    queryKey: ["shop-listings", shop?.id],
    enabled: !!shop?.id,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("search_listings", {
        _q: null,
        _location: null,
        _category: null,
        _type: null,
        _limit: 300,
      });
      if (error) throw new Error(error.message);
      return ((data ?? []) as Array<ShopListing & { user_id: string }>)
        .filter((listing) => listing.user_id === shop!.id)
        .sort((a, b) => Number(b.is_promoted) - Number(a.is_promoted));
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["shop-reviews", shop?.id],
    enabled: !!shop?.id,
    queryFn: async () => {
      const { data } = await supabase.from("shop_reviews").select("*").eq("shop_user_id", shop!.id).order("created_at", { ascending: false });
      return (data ?? []) as Array<{ id: string; reviewer_id: string; rating: number; comment: string | null; created_at: string }>;
    },
  });

  const { data: followerCount = 0 } = useQuery({
    queryKey: ["shop-followers", shop?.id],
    enabled: !!shop?.id,
    queryFn: async () => {
      const { data } = await supabase.rpc("shop_follower_count" as never, { _shop_id: shop!.id } as never);
      return Number(data ?? 0);
    },
  });

  const { data: favoritesCounts = {} } = useQuery({
    queryKey: ["shop-fav-counts", shop?.id, listings.length],
    enabled: !!shop?.id && listings.length > 0,
    queryFn: async () => {
      const ids = listings.map(l => l.id);
      const { data } = await supabase.from("favorites").select("listing_id").in("listing_id", ids);
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: { listing_id: string }) => { map[r.listing_id] = (map[r.listing_id] || 0) + 1; });
      return map;
    },
  });

  // Load follow state
  useEffect(() => {
    if (!user || !shop?.id) return;
    (async () => {
      const { data } = await supabase.rpc("is_following_shop" as never, { _shop_id: shop.id } as never);
      setFollowing(!!data);
    })();
  }, [user, shop?.id]);

  // Banner carousel autoplay
  const banners = useMemo(() => (shop?.portfolio_images ?? []).filter(Boolean).slice(0, 5), [shop?.portfolio_images]);
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const services = listings.filter((l) => l.type === "service");
  const goods = listings.filter((l) => l.type === "goods");
  const featuredListings = listings.filter((l) => l.is_promoted);
  const totalViews = listings.reduce((s, l) => s + (l.views_count ?? 0), 0);
  const totalWishlisted = Object.values(favoritesCounts as Record<string, number>).reduce((s, n) => s + n, 0);

  const ratingBreakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++; });
    return counts.map((c, i) => ({ stars: i + 1, count: c, pct: reviews.length ? (c / reviews.length) * 100 : 0 })).reverse();
  }, [reviews]);

  const achievements = useMemo(() => {
    const list: { icon: React.ReactNode; label: string; color: string }[] = [];
    if (shop?.is_verified) list.push({ icon: <BadgeCheck className="h-3.5 w-3.5" />, label: "Verified", color: "bg-blue-500/10 text-blue-700 border-blue-200" });
    if ((shop?.subscription_tier ?? "free") !== "free") list.push({ icon: <Trophy className="h-3.5 w-3.5" />, label: "Premium Seller", color: "bg-amber-500/10 text-amber-700 border-amber-200" });
    if (listings.length >= 20) list.push({ icon: <Package className="h-3.5 w-3.5" />, label: "Stocked Shop", color: "bg-purple-500/10 text-purple-700 border-purple-200" });
    if (avgRating >= 4.5 && reviews.length >= 3) list.push({ icon: <Star className="h-3.5 w-3.5" />, label: "Top Rated", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" });
    if (totalViews >= 500) list.push({ icon: <Flame className="h-3.5 w-3.5" />, label: "Hot Shop", color: "bg-orange-500/10 text-orange-700 border-orange-200" });
    if (followerCount >= 50) list.push({ icon: <Heart className="h-3.5 w-3.5" />, label: "Fan Favorite", color: "bg-pink-500/10 text-pink-700 border-pink-200" });
    if (featuredListings.length > 0) list.push({ icon: <Zap className="h-3.5 w-3.5" />, label: "Featured", color: "bg-indigo-500/10 text-indigo-700 border-indigo-200" });
    return list;
  }, [shop, listings.length, avgRating, reviews.length, totalViews, followerCount, featuredListings.length]);

  const { data: trustScore = 0 } = useQuery({
    queryKey: ["seller-trust", shop?.id],
    enabled: !!shop?.id,
    queryFn: async () => {
      const { data } = await rpcUntyped("seller_trust_score", { _uid: shop!.id! });
      return typeof data === "number" ? data : 0;
    },
  });

  const dynamicCategories = useMemo(() => {
    const cats = new Map<string, number>();
    listings.forEach(l => { if (l.category) cats.set(l.category, (cats.get(l.category) || 0) + 1); });
    return Array.from(cats.entries()).map(([name, count]) => ({ name, count }));
  }, [listings]);

  const applySort = (arr: ShopListing[]) => {
    const a = [...arr];
    switch (sortBy) {
      case "price-asc": return a.sort((x, y) => (x.price ?? 0) - (y.price ?? 0));
      case "price-desc": return a.sort((x, y) => (y.price ?? 0) - (x.price ?? 0));
      case "popular": return a.sort((x, y) => (y.views_count ?? 0) - (x.views_count ?? 0));
      case "rating": return a; // no per-listing rating column yet
      case "newest": return a; // no per-listing created ordering column fetched
      default: return a; // featured (promoted first, from query)
    }
  };

  const filteredGoods = useMemo(() => {
    const base = goods.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        item.title.toLowerCase().includes(q) ||
        (item.category ?? "").toLowerCase().includes(q) ||
        (item.location ?? "").toLowerCase().includes(q);
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      let matchesPrice = true;
      if (priceRange === "under-50k") matchesPrice = (item.price ?? 0) < 50000;
      else if (priceRange === "50k-200k") matchesPrice = (item.price ?? 0) >= 50000 && (item.price ?? 0) <= 200000;
      else if (priceRange === "above-200k") matchesPrice = (item.price ?? 0) > 200000;
      return matchesSearch && matchesCategory && matchesPrice;
    });
    return applySort(base);
  }, [goods, searchQuery, selectedCategory, priceRange, sortBy]);

  const filteredServices = useMemo(() => {
    const base = services.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || item.title.toLowerCase().includes(q) || (item.category ?? "").toLowerCase().includes(q);
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    return applySort(base);
  }, [services, searchQuery, selectedCategory, sortBy]);

  if (isLoading) return <div className="min-h-screen bg-background"><SiteHeader /><LoadingSpinner label="Loading shop…" /></div>;
  if (!shop) return <div className="min-h-screen bg-background"><SiteHeader /><div className="container py-12">Shop not found.</div></div>;

  const url = typeof window !== "undefined" ? window.location.href : "";

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: shop.business_name ?? shop.full_name ?? "Shop", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showError(error, "We couldn't share your shop link. Please try again.");
    }
  };

  const mine = user ? reviews.find((r) => r.reviewer_id === user.id) : null;
  const isOwn = user?.id === shop.id;

  const toggleFollow = async () => {
    if (!user) return toast.error("Sign in to follow this shop");
    if (isOwn) return toast.error("You can't follow your own shop");
    setFollowBusy(true);
    const { data, error } = await supabase.rpc("toggle_follow_shop" as never, { _shop_id: shop.id } as never);
    setFollowBusy(false);
    if (error) return showError(error, "We couldn't update your shop follow. Please try again.");
    setFollowing(!!data);
    qc.invalidateQueries({ queryKey: ["shop-followers", shop.id] });
    toast.success(data ? "You are following this shop" : "Unfollowed");
  };

  const submitReview = async () => {
    if (!user) return toast.error("Sign in to leave a review");
    if (isOwn) return toast.error("You can't review your own shop");
    if (rating < 1) return toast.error("Please pick a star rating between 1 and 5");
    if (comment.length > 1000) return toast.error("Comment too long (max 1000 chars)");

    setBusy(true);
    const { error } = await supabase.from("shop_reviews").upsert({
      shop_user_id: shop.id, reviewer_id: user.id, rating, comment: comment || null,
    }, { onConflict: "shop_user_id,reviewer_id" });

    setBusy(false);
    if (error) return showError(error, "We couldn't save your review. Please try again.");

    toast.success(mine ? "Review updated" : "Review posted");
    setRating(0);
    setComment("");
    qc.invalidateQueries({ queryKey: ["shop-reviews", shop.id] });
  };

  const joinedYear = shop.created_at ? new Date(shop.created_at).getFullYear() : null;

  return (
    <div className="min-h-screen bg-muted/20 pb-20 md:pb-0">
      <SiteHeader />

      {/* HERO WITH CAROUSEL */}
      <div className="relative bg-background border-b shadow-sm">
        <div className="h-48 md:h-64 w-full bg-gradient-to-r from-primary/20 via-accent/10 to-primary/30 relative overflow-hidden">
          {banners.length > 0 ? (
            <>
              {banners.map((src, i) => (
                <img key={i} src={src} alt={`Store banner ${i + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === bannerIdx ? "opacity-100" : "opacity-0"}`} />
              ))}
              {banners.length > 1 && (
                <>
                  <button onClick={() => setBannerIdx((bannerIdx - 1 + banners.length) % banners.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-1.5 rounded-full shadow" aria-label="Previous">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setBannerIdx((bannerIdx + 1) % banners.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-1.5 rounded-full shadow" aria-label="Next">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {banners.map((_, i) => (
                      <button key={i} onClick={() => setBannerIdx(i)} aria-label={`Slide ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? "w-6 bg-white" : "w-1.5 bg-white/60"}`} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
          )}
        </div>

        <div className="container mx-auto px-4 pb-6 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16 md:-mt-20 z-10 relative">
            {shop.avatar_url ? (
              <img src={shop.avatar_url} alt="Logo" className="h-28 w-28 md:h-36 md:w-36 rounded-2xl bg-background border-4 border-background shadow-md object-cover" />
            ) : (
              <div className="h-28 w-28 md:h-36 md:w-36 rounded-2xl bg-primary text-primary-foreground border-4 border-background shadow-md grid place-items-center text-4xl font-bold">
                {(shop.business_name ?? shop.full_name ?? "S")[0]}
              </div>
            )}

            <div className="flex-1 space-y-2 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{shop.business_name ?? shop.full_name}</h1>
                {shop.is_verified && <BadgeCheck className="h-6 w-6 text-accent fill-accent/10" />}
                <TierBadge tier={shop.subscription_tier} />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground font-medium">
                {shop.state && <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-primary" />{shop.state}</span>}
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {avgRating.toFixed(1)} ({reviews.length} reviews)
                </span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" />{followerCount} followers</span>
                {joinedYear && <span>• Since {joinedYear}</span>}
              </div>

              {achievements.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {achievements.map((a, i) => (
                    <span key={i} className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${a.color}`}>
                      {a.icon}{a.label}
                    </span>
                  ))}
                </div>
              )}

              {shop.bio && <p className="max-w-2xl text-foreground/80 text-sm mt-2 line-clamp-2 md:line-clamp-none">{shop.bio}</p>}
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0">
              {!isOwn && (
                <Button onClick={toggleFollow} disabled={followBusy} variant={following ? "secondary" : "default"} size="sm" className="flex-1 md:flex-none">
                  <Heart className={`h-4 w-4 mr-1 ${following ? "fill-current" : ""}`} />{following ? "Following" : "Follow"}
                </Button>
              )}
              <Button onClick={share} variant="outline" size="sm" className="flex-1 md:flex-none"><Share2 className="h-4 w-4 mr-1" />Share</Button>
              {user ? (
                <>
                  {contact?.phone && <Button variant="outline" size="sm" className="flex-1 md:flex-none bg-accent/5 text-accent border-accent/20 hover:bg-accent/10"><Phone className="h-4 w-4 mr-1" />{contact.phone}</Button>}
                  {contact?.whatsapp && <Button asChild variant="outline" size="sm" className="flex-1 md:flex-none"><a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-1 text-green-500" />WhatsApp</a></Button>}
                </>
              ) : (
                <Button asChild variant="default" size="sm" className="flex-1 md:flex-none"><Link to="/auth"><Phone className="h-4 w-4 mr-1" />Sign in to Contact</Link></Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* LEFT COLUMN */}
        <div className="space-y-6 lg:col-span-1">

          {/* REAL ANALYTICS */}
          <Card className="p-4 shadow-sm grid grid-cols-2 gap-3">
            <div className="bg-muted/40 p-3 rounded-xl border flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary"><Package className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Products</p>
                <p className="text-lg font-bold">{listings.length}</p>
              </div>
            </div>
            <div className="bg-muted/40 p-3 rounded-xl border flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg text-accent"><Users className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Followers</p>
                <p className="text-lg font-bold">{followerCount}</p>
              </div>
            </div>
            <div className="bg-muted/40 p-3 rounded-xl border flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg text-green-600"><Eye className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Views</p>
                <p className="text-lg font-bold">{totalViews >= 1000 ? `${(totalViews/1000).toFixed(1)}k` : totalViews}</p>
              </div>
            </div>
            <div className="bg-muted/40 p-3 rounded-xl border flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 rounded-lg text-pink-600"><Bookmark className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Wishlisted</p>
                <p className="text-lg font-bold">{totalWishlisted}</p>
              </div>
            </div>
          </Card>

          {/* TRUST SCORE */}
          <Card className="p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Trust Score</span>
              </div>
              <span className="text-lg font-extrabold">{trustScore}<span className="text-xs text-muted-foreground">/100</span></span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-primary transition-all" style={{ width: `${trustScore}%` }} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Verified activity & reputation
            </p>
          </Card>

          {/* CATEGORIES */}
          <Card className="p-4 shadow-sm hidden md:block">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5"><SlidersHorizontal className="h-4 w-4" /> Store Categories</h3>
            <div className="space-y-1">
              <button onClick={() => setSelectedCategory("all")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center transition ${selectedCategory === "all" ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted text-muted-foreground"}`}>
                <span>All Categories</span>
                <span className="text-xs opacity-70">{listings.length}</span>
              </button>
              {dynamicCategories.map((cat) => (
                <button key={cat.name} onClick={() => setSelectedCategory(cat.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center capitalize transition ${selectedCategory === cat.name ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted text-muted-foreground"}`}>
                  <span>{cat.name}</span>
                  <span className="text-xs opacity-70">{cat.count}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* QR */}
          <Card className="p-4 text-center shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Scan to visit storefront</p>
            <div className="bg-white p-3 rounded-xl inline-block border shadow-inner">
              <QRCodeSVG value={url} size={130} />
            </div>
            <p className="text-xs text-muted-foreground mt-3 break-all bg-muted p-2 rounded-lg border border-dashed font-mono">{url}</p>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-3 space-y-6">

          {/* CATEGORY CHIPS (horizontal, mobile+desktop) */}
          {dynamicCategories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
              <button onClick={() => setSelectedCategory("all")}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${selectedCategory === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}>
                All ({listings.length})
              </button>
              {dynamicCategories.map(c => (
                <button key={c.name} onClick={() => setSelectedCategory(c.name)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border capitalize transition ${selectedCategory === c.name ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}>
                  {c.name} ({c.count})
                </button>
              ))}
            </div>
          )}

          {/* SEARCH + FILTERS + SORT */}
          <Card className="p-4 shadow-sm bg-background flex flex-col md:flex-row items-center gap-3">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, category, location…"
                className="w-full pl-9 pr-4 py-2 bg-muted/50 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition" />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}
                className="w-full md:w-auto text-sm border bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="all">All Prices</option>
                <option value="under-50k">Under ₦50,000</option>
                <option value="50k-200k">₦50,000 - ₦200,000</option>
                <option value="above-200k">Above ₦200,000</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="w-full md:w-auto text-sm border bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="featured">Featured</option>
                <option value="popular">Most Viewed</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
            </div>
          </Card>

          {/* FEATURED */}
          {featuredListings.length > 0 && !searchQuery && selectedCategory === "all" && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> Featured Displays
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {featuredListings.slice(0, 3).map((l) => (
                  <Link key={l.id} to="/listing/$id" params={{ id: l.id }} className="relative group rounded-xl border bg-background overflow-hidden hover:shadow-md transition">
                    <div className="aspect-square bg-muted">
                      {l.images?.[0] && <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition" />}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold line-clamp-1">{l.title}</p>
                      <p className="text-sm font-extrabold">{formatNaira(l.price ?? 0)}</p>
                    </div>
                    <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow">Pinned</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* GRID */}
          <section>
            <Tabs defaultValue="listings" className="w-full">
              <div className="flex items-center justify-between border-b pb-1">
                <TabsList className="bg-transparent h-auto p-0 gap-6">
                  <TabsTrigger value="listings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent p-2 font-bold text-sm data-[state=active]:shadow-none">
                    Products ({filteredGoods.length})
                  </TabsTrigger>
                  <TabsTrigger value="portfolio" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent p-2 font-bold text-sm data-[state=active]:shadow-none">
                    Services ({filteredServices.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="listings" className="mt-4 focus-visible:outline-none">
                {filteredGoods.length === 0 ? (
                  <div className="text-center py-12 bg-background rounded-xl border border-dashed">
                    <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-60" />
                    <p className="text-muted-foreground font-medium text-sm">No matching products found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
                    {filteredGoods.map((l) => {
                      const favs = (favoritesCounts as Record<string, number>)[l.id] ?? 0;
                      const views = l.views_count ?? 0;
                      const lowStock = views > 20 && views < 60;
                      return (
                        <Link key={l.id} to="/listing/$id" params={{ id: l.id }} className="group relative rounded-xl border border-border bg-background overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col justify-between">
                          <div>
                            <div className="aspect-square bg-muted relative overflow-hidden">
                              {l.images && l.images[0] ? (
                                <img src={l.images[0]} alt={l.title} className="object-cover w-full h-full transition group-hover:scale-105" />
                              ) : (
                                <div className="w-full h-full bg-muted/60 flex items-center justify-center text-muted-foreground/40 text-xs">No Image</div>
                              )}
                              {l.is_promoted && (
                                <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] font-bold">Premium</Badge>
                              )}
                              {lowStock && (
                                <Badge className="absolute bottom-2 left-2 bg-orange-500 text-white text-[10px] font-bold border-0">
                                  <TrendingUp className="h-2.5 w-2.5 mr-0.5" />Selling fast
                                </Badge>
                              )}
                              {favs > 0 && (
                                <span className="absolute top-2 right-2 flex items-center gap-1 bg-background/90 backdrop-blur text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                                  <Heart className="h-3 w-3 text-pink-500 fill-pink-500" />{favs}
                                </span>
                              )}
                            </div>
                            <div className="p-3.5 space-y-1.5">
                              <span className="text-[10px] font-bold uppercase text-accent/90 tracking-wider block">{l.category || "General"}</span>
                              <h3 className="text-sm font-semibold tracking-tight text-foreground line-clamp-2 min-h-[40px] group-hover:text-primary transition-colors">
                                {l.title}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {views} views</span>
                                {(l.clicks_count ?? 0) > 0 && <><span>•</span><span>{l.clicks_count} clicks</span></>}
                              </div>
                            </div>
                          </div>
                          <div className="p-3.5 pt-0 border-t bg-muted/5 flex items-center justify-between">
                            <p className="text-base font-extrabold text-foreground">{formatNaira(l.price ?? 0)}</p>
                            {l.location && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin className="h-3 w-3" />{l.location}</span>}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="portfolio" className="mt-4 focus-visible:outline-none">
                {filteredServices.length === 0 ? (
                  <div className="text-center py-12 bg-background rounded-xl border border-dashed">
                    <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-60" />
                    <p className="text-muted-foreground font-medium text-sm">No services listed yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
                    {filteredServices.map((l) => (
                      <Link key={l.id} to="/listing/$id" params={{ id: l.id }} className="rounded-xl overflow-hidden border border-border bg-background shadow-sm hover:shadow-md transition">
                        <div className="aspect-video bg-muted relative">
                          {l.images && l.images[0] ? (
                            <img src={l.images[0]} alt={l.title} className="object-cover w-full h-full" />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                          )}
                        </div>
                        <div className="p-3.5 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-primary tracking-wider">{l.category || "Service"}</span>
                          <p className="text-sm font-semibold text-foreground line-clamp-1">{l.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{l.location || "Remote"}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t pt-4 mt-6">
              <p className="text-xs text-muted-foreground font-medium">
                Total inventory value: <span className="text-foreground font-bold">{formatNaira(listings.reduce((s, l) => s + (l.price ?? 0), 0))}</span>
              </p>
              <Link to="/" className="text-accent hover:underline text-sm font-semibold flex items-center gap-1">
                ← Back to marketplace
              </Link>
            </div>
          </section>

          {/* REVIEWS with BREAKDOWN */}
          {shop.id && (
            <Card className="p-6 shadow-sm bg-background">
              <div className="flex items-center justify-between flex-wrap gap-3 border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Customer Reviews</h2>
                  <p className="text-xs text-muted-foreground">Verified buyer testimonials.</p>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-4 w-4 ${n <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <span className="font-extrabold text-sm">{avgRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({reviews.length})</span>
                </div>
              </div>

              {reviews.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="text-center bg-muted/30 rounded-xl p-4">
                    <p className="text-4xl font-extrabold">{avgRating.toFixed(1)}</p>
                    <div className="flex justify-center my-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`h-4 w-4 ${n <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Based on {reviews.length} review{reviews.length === 1 ? "" : "s"}</p>
                  </div>
                  <div className="space-y-1.5">
                    {ratingBreakdown.map(row => (
                      <div key={row.stars} className="flex items-center gap-2 text-xs">
                        <span className="w-4 font-medium">{row.stars}</span>
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400" style={{ width: `${row.pct}%` }} />
                        </div>
                        <span className="w-8 text-right text-muted-foreground">{row.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {user && !isOwn && (
                <div className="mt-4 p-4 rounded-xl border border-primary/10 space-y-3 bg-primary/5">
                  <p className="text-sm font-semibold text-foreground">{mine ? "Update your review" : "Leave a review"}</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
                        <Star className={`h-6 w-6 transition ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground hover:text-amber-300"}`} />
                      </button>
                    ))}
                  </div>
                  <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience with this shop…" className="bg-background" />
                  <Button onClick={submitReview} disabled={busy} size="sm">
                    <Send className="h-4 w-4 mr-1.5" />{busy ? "Sending…" : "Submit Review"}
                  </Button>
                </div>
              )}

              {!user && <p className="text-xs text-muted-foreground mt-4 text-center py-2 bg-muted/40 rounded-lg">Sign in to leave a review.</p>}
              {isOwn && <p className="text-xs text-muted-foreground mt-4 text-center py-2 bg-muted/40 rounded-lg">You cannot review your own shop.</p>}

              <div className="mt-6 space-y-4 divide-y">
                {reviews.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No reviews yet — be the first.</p>}
                {reviews.map((r, i) => (
                  <div key={r.id} className={`pt-4 ${i === 0 ? "pt-0" : ""}`}>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`h-3 w-3 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                      ))}
                      <span className="text-[11px] text-muted-foreground ml-2 font-medium">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    {r.comment && <p className="text-sm text-foreground/90 mt-1.5 pl-0.5">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* MOBILE FLOATING CONTACT BAR */}
      {!isOwn && (
        <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-background border-t shadow-lg px-3 py-2 flex items-center gap-2">
          <Button onClick={toggleFollow} disabled={followBusy} variant={following ? "secondary" : "outline"} size="sm" className="flex-1">
            <Heart className={`h-4 w-4 ${following ? "fill-current text-pink-500" : ""}`} />
          </Button>
          <Button onClick={share} variant="outline" size="sm" className="flex-1">
            <Share2 className="h-4 w-4" />
          </Button>
          {user && contact?.whatsapp ? (
            <Button asChild size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white">
              <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-1" />Chat</a>
            </Button>
          ) : user && contact?.phone ? (
            <Button asChild size="sm" className="flex-1">
              <a href={`tel:${contact.phone}`}><Phone className="h-4 w-4 mr-1" />Call</a>
            </Button>
          ) : (
            <Button asChild size="sm" className="flex-1"><Link to="/auth"><Phone className="h-4 w-4 mr-1" />Contact</Link></Button>
          )}
        </div>
      )}
    </div>
  );
}
