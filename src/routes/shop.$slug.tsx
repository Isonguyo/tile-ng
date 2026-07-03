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
import { useState, useMemo, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  Share2, Phone, MessageCircle, MapPin, BadgeCheck, Star, Send,
  Search, SlidersHorizontal, Package, Users, Heart, Eye, TrendingUp,
  Award, Zap, Flame, Trophy, CheckCircle2, Clock, Save, Bookmark
} from "lucide-react";

export const Route = createFileRoute("/shop/$slug")({
  head: () => ({ meta: [{ title: "Shop — Tile" }] }),
  component: ShopPage,
});

function ShopPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");

  // Review states
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

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
  };

  // Fetch Shop Data
  const { data: shop, isLoading } = useQuery<Shop | null>({
    queryKey: ["shop", slug],
    queryFn: async () => {
      const { data } = await (supabase.from("public_profiles") as unknown as { select: (c: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: Shop | null }> } } })
        .select("*").eq("shop_slug", slug).maybeSingle();
      return data ?? null;
    },
  });

  // Fetch Contact Info
  const { data: contact } = useQuery<{ phone: string | null; whatsapp: string | null } | null>({
    queryKey: ["shop-contact", slug, !!user],
    enabled: !!user && !!shop?.id,
    queryFn: async () => {
      const { data } = await supabase.rpc("shop_contact" as never, { _slug: slug } as never);
      const row = (Array.isArray(data) ? data[0] : data) as { phone: string | null; whatsapp: string | null } | null;
      return row ?? null;
    },
  });

  // Fetch Listings
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

  // Fetch Reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ["shop-reviews", shop?.id],
    enabled: !!shop?.id,
    queryFn: async () => {
      const { data } = await supabase.from("shop_reviews").select("*").eq("shop_user_id", shop!.id).order("created_at", { ascending: false });
      return (data ?? []) as Array<{ id: string; reviewer_id: string; rating: number; comment: string | null; created_at: string }>;
    },
  });

  // Analytics Transformations
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const services = listings.filter((l) => l.type === "service");
  const goods = listings.filter((l) => l.type === "goods");
  const featuredListings = listings.filter((l) => l.is_promoted);

  // Derive unique store categories dynamically
  const dynamicCategories = useMemo(() => {
    const cats = new Map<string, number>();
    listings.forEach(l => {
      if (l.category) {
        cats.set(l.category, (cats.get(l.category) || 0) + 1);
      }
    });
    return Array.from(cats.entries()).map(([name, count]) => ({ name, count }));
  }, [listings]);

  // Client-side Searching and Filtering Logic
  const filteredGoods = useMemo(() => {
    return goods.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      
      let matchesPrice = true;
      if (priceRange === "under-50k") matchesPrice = (item.price ?? 0) < 50000;
      else if (priceRange === "50k-200k") matchesPrice = (item.price ?? 0) >= 50000 && (item.price ?? 0) <= 200000;
      else if (priceRange === "above-200k") matchesPrice = (item.price ?? 0) > 200000;

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [goods, searchQuery, selectedCategory, priceRange]);

  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);

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
    } catch { /* ignore */ }
  };

  const mine = user ? reviews.find((r) => r.reviewer_id === user.id) : null;
  const isOwn = user?.id === shop.id;

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
    if (error) return toast.error(error.message);
    
    toast.success(mine ? "Review updated" : "Review posted");
    setRating(0); 
    setComment("");
    qc.invalidateQueries({ queryKey: ["shop-reviews", shop.id] });
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <SiteHeader />

      {/* 1. HERO SECTION (STORE HEADER) */}
      <div className="relative bg-background border-b shadow-sm">
        <div className="h-48 md:h-64 w-full bg-gradient-to-r from-primary/20 via-accent/10 to-primary/30 relative overflow-hidden">
          {shop.portfolio_images && shop.portfolio_images[0] ? (
            <img src={shop.portfolio_images[0]} alt="Store banner" className="w-full h-full object-cover" />
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
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
                  {shop.business_name ?? shop.full_name}
                </h1>
                {shop.is_verified && <BadgeCheck className="h-6 w-6 text-accent fill-accent/10" />}
                <TierBadge tier={shop.subscription_tier} />
                {shop.subscription_tier && shop.subscription_tier !== "free" && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Premium Seller</Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground font-medium">
                {shop.state && <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-primary" />{shop.state}</span>}
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 
                  {avgRating.toFixed(1)} ({reviews.length} reviews)
                </span>
                <span>• Joined Marketplace</span>
              </div>

              {shop.bio && <p className="max-w-2xl text-foreground/80 text-sm mt-2 line-clamp-2 md:line-clamp-none">{shop.bio}</p>}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0">
              <Button onClick={share} variant="outline" size="sm" className="flex-1 md:flex-none"><Share2 className="h-4 w-4 mr-1" />Share</Button>
              {user ? (
                <>
                  {contact?.phone && <Button variant="outline" size="sm" className="flex-1 md:flex-none bg-accent/5 text-accent border-accent/20 hover:bg-accent/10"><Phone className="h-4 w-4 mr-1" />{contact.phone}</Button>}
                  {contact?.whatsapp && <Button asChild variant="outline" size="sm" className="flex-1 md:flex-none"><a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-1 text-green-500 fill-green-500/10" />WhatsApp</a></Button>}
                </>
              ) : (
                <Button asChild variant="default" size="sm" className="flex-1 md:flex-none bg-accent text-accent-foreground"><Link to="/auth"><Phone className="h-4 w-4 mr-1" />Sign in to Contact</Link></Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: ANALYTICS, QR CODE & DYNAMIC CATEGORIES NAVIGATION */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* 2. STORE ANALYTICS SECTION */}
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
                <p className="text-lg font-bold">1.2k</p>
              </div>
            </div>
            <div className="bg-muted/40 p-3 rounded-xl border flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg text-green-600"><ShoppingBag className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Orders</p>
                <p className="text-lg font-bold">450+</p>
              </div>
            </div>
            <div className="bg-muted/40 p-3 rounded-xl border flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Star className="h-5 w-5 fill-amber-500/10" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Rating</p>
                <p className="text-lg font-bold">{avgRating ? `${avgRating.toFixed(1)}/5` : "N/A"}</p>
              </div>
            </div>
          </Card>

          {/* 7. STORE CATEGORIES QUICK SIDEBAR NAVIGATION */}
          <Card className="p-4 shadow-sm hidden md:block">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5"><SlidersHorizontal className="h-4 w-4" /> Store Categories</h3>
            <div className="space-y-1">
              <button 
                onClick={() => setSelectedCategory("all")} 
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center transition ${selectedCategory === "all" ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted text-muted-foreground"}`}
              >
                <span>All Categories</span>
                <span className="text-xs opacity-70">{listings.length}</span>
              </button>
              {dynamicCategories.map((cat) => (
                <button 
                  key={cat.name} 
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center capitalize transition ${selectedCategory === cat.name ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted text-muted-foreground"}`}
                >
                  <span>{cat.name}</span>
                  <span className="text-xs opacity-70">{cat.count}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* QR Code */}
          <Card className="p-4 text-center shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Scan to visit storefront</p>
            <div className="bg-white p-3 rounded-xl inline-block border shadow-inner">
              <QRCodeSVG value={url} size={130} />
            </div>
            <p className="text-xs text-muted-foreground mt-3 break-all bg-muted p-2 rounded-lg border border-dashed font-mono">{url}</p>
          </Card>

        </div>

        {/* RIGHT COLUMN: SEARCH, MAIN INVENTORY, FEATURED AND GRID */}
        <div className="lg:col-span-3 space-y-6">

          {/* 3. PRODUCT SEARCH & 4. FILTER BAR */}
          <Card className="p-4 shadow-sm bg-background flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items in this storefront..."
                className="w-full pl-9 pr-4 py-2 bg-muted/50 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select 
                value={priceRange} 
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full md:w-auto text-sm border bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="all">All Prices</option>
                <option value="under-50k">Under ₦50,000</option>
                <option value="50k-200k">₦50,000 - ₦200,000</option>
                <option value="above-200k">Above ₦200,000</option>
              </select>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="md:hidden w-full text-sm border bg-background rounded-lg px-3 py-2"
              >
                <option value="all">All Categories</option>
                {dynamicCategories.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
          </Card>

          {/* 5. FEATURED PRODUCTS (PINS) */}
          {featuredListings.length > 0 && !searchQuery && selectedCategory === "all" && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> Featured Displays
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {featuredListings.slice(0, 3).map((l) => (
                  <div key={l.id} className="relative group transition-transform duration-200 hover:-translate-y-1">
                    <ListingCard l={l} />
                    <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow">Pinned</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. MAIN PRODUCT GRID UPGRADE CONTEXT */}
          <section>
            <Tabs defaultValue="listings" className="w-full">
              <div className="flex items-center justify-between border-b pb-1">
                <TabsList className="bg-transparent h-auto p-0 gap-6">
                  <TabsTrigger value="listings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent p-2 font-bold text-sm data-[state=active]:shadow-none">
                    Active Storefront ({filteredGoods.length})
                  </TabsTrigger>
                  <TabsTrigger value="portfolio" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent p-2 font-bold text-sm data-[state=active]:shadow-none">
                    Service Portfolio ({filteredServices.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="listings" className="mt-4 focus-visible:outline-none">
                {filteredGoods.length === 0 ? (
                  <div className="text-center py-12 bg-background rounded-xl border border-dashed">
                    <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-60" />
                    <p className="text-muted-foreground font-medium text-sm">No matched product inventories found.</p>
                  </div>
                ) : (
                  /* Custom Grid Layout containing robust data nodes */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
                    {filteredGoods.map((l) => (
                      <div key={l.id} className="group relative rounded-xl border border-border bg-background overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col justify-between">
                        <div>
                          {/* Image Node Wrapper */}
                          <div className="aspect-square bg-muted relative overflow-hidden">
                            {l.images && l.images[0] ? (
                              <img src={l.images[0]} alt={l.title} className="object-cover w-full h-full transition group-hover:scale-105" />
                            ) : (
                              <div className="w-full h-full bg-muted/60 flex items-center justify-center text-muted-foreground/40 text-xs">No Image</div>
                            )}
                            
                            {/* Actions overlaying Image Node */}
                            {l.is_promoted && (
                              <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] font-bold">Premium</Badge>
                            )}
                            <button aria-label="Add to wishlist" className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive shadow-sm transition">
                              <Heart className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Metadata Node Content wrapper */}
                          <div className="p-3.5 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase text-accent/90 tracking-wider block">{l.category || "General"}</span>
                            <h3 className="text-sm font-semibold tracking-tight text-foreground line-clamp-2 min-h-[40px] group-hover:text-primary transition-colors">
                              {l.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> 140 views</span>
                              <span>•</span>
                              <span>Sold: 12</span>
                            </div>
                          </div>
                        </div>

                        {/* Price Node Bottom Frame */}
                        <div className="p-3.5 pt-0 border-t bg-muted/5 flex items-center justify-between">
                          <p className="text-base font-extrabold text-foreground">{formatNaira(l.price ?? 0)}</p>
                          <div className="flex items-center gap-0.5 text-amber-500 text-xs font-bold">
                            <Star className="h-3 w-3 fill-amber-500" /> 4.8
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="portfolio" className="mt-4 focus-visible:outline-none">
                {filteredServices.length === 0 ? (
                  <div className="text-center py-12 bg-background rounded-xl border border-dashed">
                    <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-60" />
                    <p className="text-muted-foreground font-medium text-sm">No matched portfolio entities entries yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
                    {filteredServices.map((l) => (
                      <div key={l.id} className="rounded-xl overflow-hidden border border-border bg-background shadow-sm hover:shadow-md transition">
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
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t pt-4 mt-6">
              <p className="text-xs text-muted-foreground font-medium">
                Total aggregate inventory valuation: <span className="text-foreground font-bold">{formatNaira(listings.reduce((s, l) => s + (l.price ?? 0), 0))}</span>
              </p>
              <Link to="/" className="text-accent hover:underline text-sm font-semibold flex items-center gap-1">
                ← Back to marketplace ecosystem
              </Link>
            </div>
          </section>

          {/* REVIEWS SEGMENT MODULE */}
          {shop.id && (
            <Card className="p-6 shadow-sm bg-background">
              <div className="flex items-center justify-between flex-wrap gap-3 border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Customer Critiques & Reviews</h2>
                  <p className="text-xs text-muted-foreground">Verified buyer testimonials left for this vendor.</p>
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

              {user && !isOwn && (
                <div className="mt-4 p-4 rounded-xl border border-primary/10 space-y-3 bg-primary/5">
                  <p className="text-sm font-semibold text-foreground">{mine ? "Update your store review" : "Leave a store review"}</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
                        <Star className={`h-6 w-6 transition ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground hover:text-amber-300"}`} />
                      </button>
                    ))}
                  </div>
                  <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Describe your encounter or purchase logistics experience (optional)..." className="bg-background" />
                  <Button onClick={submitReview} disabled={busy} className="bg-accent text-accent-foreground font-semibold" size="sm">
                    <Send className="h-4 w-4 mr-1.5" />{busy ? "Sending…" : "Submit Review"}
                  </Button>
                </div>
              )}
              
              {!user && <p className="text-xs text-muted-foreground mt-4 text-center py-2 bg-muted/40 rounded-lg">Sign in to initialize an experience review.</p>}
              {isOwn && <p className="text-xs text-muted-foreground mt-4 text-center py-2 bg-muted/40 rounded-lg">You cannot review or rank your native storefront.</p>}

              <div className="mt-6 space-y-4 divide-y">
                {reviews.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No storefront feedback posted yet — be the first.</p>}
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
    </div>
  );
}
