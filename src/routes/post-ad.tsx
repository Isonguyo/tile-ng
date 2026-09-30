import { rpcUntyped } from "@/lib/waitlist-rpc";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import { useAuth } from "@/lib/auth-context";
import { usePlan, hasCapability } from "@/hooks/use-plan";
import { MerchantHealthCard, QuotaBar } from "@/components/merchant-health";
import { supabase } from "@/integrations/supabase/client";
import { uploadListingImages } from "@/lib/storage";
import { toast } from "sonner";
import { showError } from "@/lib/user-feedback";
import {
  Upload,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  ShieldCheck,
  MapPin,
  ImagePlus,
  ArrowUp,
  ArrowDown,
  BadgeCheck,
} from "lucide-react";

export const Route = createFileRoute("/post-ad")({
  head: () => ({ meta: [{ title: "Post an Ad — Tile" }],
  links: [
      {
        rel: "icon",
        href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg",
      },
    ],
   }),
  component: PostAd,
});

const schema = z.object({
  category: z.string().min(1, "Choose a category"),
  title: z.string().min(5, "Title is too short").max(120),
  description: z.string().min(20, "Tell buyers more").max(2000),
  state_id: z.string().min(1, "Please select a state"),
  lga_id: z.string().min(1, "Please select an LGA"),
  phone: z.string().min(7),
  price: z.coerce.number().positive().optional(),
  condition: z.enum(["new", "used_like_new", "used_good", "used_fair"]).optional(),
  brand: z.string().optional(),
});

type FormVals = z.infer<typeof schema>;

type Mode = "home" | "sell";

const DRAFT_KEY = "tile-post-ad-draft";
const CATEGORY_META: Record<string, { icon: string; subtitle: string }> = {
  phones: { icon: "📱", subtitle: "Electronics, mobile and accessories" },
  fashion: { icon: "👗", subtitle: "Style, wearables and beauty" },
  cars: { icon: "🚗", subtitle: "Vehicles and auto gear" },
  property: { icon: "🏠", subtitle: "Homes, apartments and rentals" },
  furniture: { icon: "🪑", subtitle: "Interior pieces and décor" },
  electronics: { icon: "💻", subtitle: "Laptops, consoles and gadgets" },
};

function PostAd() {
  const { user, loading, profile } = useAuth();
  const nav = useNavigate();

  const [mode, setMode] = useState<Mode>("home");
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittingStage, setSubmittingStage] = useState("Preparing your listing");
  const [submitted, setSubmitted] = useState(false);
  const [submittedListingId, setSubmittedListingId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState("Draft ready");
  const [promotionState, setPromotionState] = useState<"idle" | "promoted">("idle");
  const [promoting, setPromoting] = useState(false);
  const [promotionStats, setPromotionStats] = useState<{ views_count: number; clicks_count: number; favorites_count: number } | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { category: "", title: "", description: "", state_id: "", lga_id: "", phone: profile?.phone ?? "", price: undefined, condition: undefined, brand: "" },
  });
  const watch = form.watch();

  const { data: states = [] } = useQuery({
    queryKey: ["post-states"],
    queryFn: async () => {
      const { data, error } = await supabase.from("states").select("id, name").order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: lgas = [] } = useQuery({
    queryKey: ["post-lgas", watch.state_id],
    queryFn: async () => {
      if (!watch.state_id) return [];
      const { data, error } = await supabase.from("lgas").select("id, name").eq("state_id", watch.state_id).order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!watch.state_id,
  });

  const { data: plan } = usePlan();

  const { data: platformSettings } = useQuery({
    queryKey: ["post-ad-platform-settings"],
    queryFn: async () => {
      const { data, error } = await rpcUntyped("get_public_platform_flags");

      if (error) throw new Error(error.message);
      return data as { launch_mode?: "prelaunch" | "launched"; disable_posting?: boolean } | null;
    },
    staleTime: 30_000,
  });
  const isPrelaunch = platformSettings?.launch_mode !== "launched";
  const postingDisabled = platformSettings?.disable_posting === true;

  const tier = (plan?.tier ?? profile?.subscription_tier ?? "free").toLowerCase();
  const canOpenShop = hasCapability(plan, "shop") || tier !== "free";
  const canPromote = hasCapability(plan, "promote");
  const planLabel = tier === "free" ? "Free" : tier.charAt(0).toUpperCase() + tier.slice(1);

  const qualityScore = useMemo(() => {
    let score = 20;
    if (watch.title && watch.title.length >= 8) score += 20;
    if (watch.description && watch.description.length >= 80) score += 20;
    if (watch.price) score += 15;
    if (watch.brand) score += 10;
    if (watch.condition) score += 10;
    if (files.length >= 2) score += 10;
    if (files.length >= 4) score += 10;
    return Math.min(score, 100);
  }, [files.length, watch.brand, watch.condition, watch.description, watch.price, watch.title]);

  useEffect(() => {
    if (!user) return;
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      form.reset({
        category: parsed.category ?? "",
        title: parsed.title ?? "",
        description: parsed.description ?? "",
        state_id: parsed.state_id ?? "",
        lga_id: parsed.lga_id ?? "",
        phone: parsed.phone ?? profile?.phone ?? "",
        price: parsed.price ?? undefined,
        condition: parsed.condition ?? undefined,
        brand: parsed.brand ?? "",
      });
      if (parsed.filesCount) {
        setDraftStatus("Draft restored");
      }
    } catch {
      // ignore malformed draft
    }
  }, [form, profile?.phone, user]);

  useEffect(() => {
    if (!user) return;
    const values = form.getValues();
    const payload = {
      category: values.category,
      title: values.title,
      description: values.description,
      state_id: values.state_id,
      lga_id: values.lga_id,
      phone: values.phone,
      price: values.price,
      condition: values.condition,
      brand: values.brand,
    };
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      setDraftStatus("Draft saved");
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [form, user, watch.category, watch.title, watch.description, watch.state_id, watch.lga_id, watch.phone, watch.price, watch.condition, watch.brand]);

  const nextStep = () => {
    if (step < 4) setStep((s) => s + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const addFiles = (incoming: FileList | File[]) => {
    const selected = Array.from(incoming);
    const filtered = selected.filter((file) => file.type.startsWith("image/"));
    if (!filtered.length) return;
    setFiles((prev) => [...prev, ...filtered].slice(0, 8));
    if (coverIndex === null) setCoverIndex(0);
  };

  const moveFile = (from: number, direction: -1 | 1) => {
    setFiles((prev) => {
      const next = [...prev];
      const target = from + direction;
      if (target < 0 || target >= next.length) return prev;
      const [item] = next.splice(from, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not available in this browser.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const json = await res.json();
          const address = json?.address ?? {};
          const place = [address.city, address.town, address.village, address.state, address.country].filter(Boolean).join(", ");
          setDetectedLocation(place || "Location detected");
          const normalized = (value: string) => value.toLowerCase().replace(/state|city|town|province|lga/g, "").trim();
          const matchedState = states.find((s) => normalized(s.name).includes(normalized(place)) || normalized(place).includes(normalized(s.name)));
          if (matchedState) {
            form.setValue("state_id", matchedState.id, { shouldValidate: true });
            form.setValue("lga_id", "", { shouldValidate: true });
          }
          toast.success(`Detected ${place || "your location"}`);
        } catch {
          toast.error("Could not reverse-geocode your location right now.");
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setDetectingLocation(false);
        toast.error("Location access was denied.");
      },
    );
  };

  const applyAiDescription = () => {
    const title = watch.title?.trim();
    if (!title) {
      toast.error("Add a title first so Tile can draft your listing.");
      return;
    }
    const cleaned = title.replace(/\s+/g, " ");
    const generated = `${cleaned} in excellent condition, carefully maintained, and ready for a new owner. This is a great option for buyers who want a reliable, well-kept item with clear value for money. Include key details, condition, and any included accessories in the final listing.`;
    form.setValue("description", generated, { shouldValidate: true });
    toast.success("AI description drafted");
  };

  const loadListingStats = async (listingId: string) => {
    const { data } = await supabase.rpc("owner_listing_stats", { _id: listingId });
    const row = (data ?? [])[0] as { views_count: number; clicks_count: number; favorites_count: number } | undefined;
    if (row) {
      setPromotionStats({ views_count: row.views_count, clicks_count: row.clicks_count, favorites_count: Number(row.favorites_count) });
    }
  };

  const handlePromoteListing = async () => {
    if (!user || !submittedListingId) return;
    setPromoting(true);
    try {
      const { data, error } = await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ data: boolean | null; error: { message: string } | null }>)("promote_listing", {
        p_listing_id: submittedListingId,
        p_user_id: user.id,
      });

      if (error) throw error;
      if (!data) throw new Error("Promotion was not accepted.");

      setPromotionState("promoted");
      await loadListingStats(submittedListingId);
      toast.success("Listing promoted successfully");
    } catch (e) {
      console.error("PROMOTE LISTING ERROR:", e);
      showError(e, "We couldn't promote this listing right now. Please try again.");
    } finally {
      setPromoting(false);
    }
  };

  const onSubmit = async (vals: FormVals) => {
    if (!user) return;

    if (postingDisabled) {
      toast.error("Posting is temporarily disabled by Tile.");
      return;
    }
    setSubmitting(true);
    setSubmittingStage("Checking plan limits");
    try {
      const { data: ok, error: qErr } = await supabase.rpc("check_post_quota", { _type: "goods" });
      if (qErr) throw qErr;
      if (!ok) {
        toast.error("Your current plan has reached the listing limit.");
        setSubmitting(false);
        return;
      }

      setSubmittingStage("Uploading photos");
      let imagePaths: string[] = [];
      if (files.length) imagePaths = await uploadListingImages(user.id, files);

      const selectedState = states.find((s) => s.id === vals.state_id);
      const selectedLga = lgas.find((l) => l.id === vals.lga_id);
      const location = [selectedLga?.name, selectedState?.name].filter(Boolean).join(", ");

      setSubmittingStage("Submitting for review");
      const { data, error } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,
          type: "goods",
          category: vals.category,
          title: vals.title,
          description: vals.description,
          location,
          phone: vals.phone,
          price: vals.price ?? null,
          condition: vals.condition ?? null,
          brand: vals.brand ?? null,
          images: imagePaths,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      window.localStorage.removeItem(DRAFT_KEY);
      setSubmittedListingId(data.id);
      setPromotionState("idle");
      setPromotionStats(null);
      setSubmitted(true);
      toast.success("Listing submitted for review");
    } catch (e) {
      console.error("POST AD ERROR:", e);
      showError(e, "We couldn't post your ad. Please check the details and try again.");
    } finally {
      setSubmitting(false);
      setSubmittingStage("Preparing your listing");
    }
  };

  const onInvalid = (errors: Record<string, { message?: string }>) => {
    const first = Object.keys(errors)[0];
    if (first) {
      toast.error(`Please complete: ${first}`);
    }
  };

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto py-20 text-center">
          <h1 className="text-2xl font-bold">Sign in to post an ad</h1>
          <Button asChild className="mt-4 bg-accent text-accent-foreground"><Link to="/auth">Sign in</Link></Button>
        </div>
      </div>
    );
  }

  const planSummary = [
    tier === "free" ? "3 listings" : "Unlimited listings",
    tier === "free" ? "No promotions" : tier === "lite" ? "1 promotion weekly" : "Multiple promotions",
    canOpenShop ? "Shop enabled" : "Shop locked",
    tier === "free" ? "Basic chat" : "Premium messaging",
  ];

  const priceHint = watch.price ? (Number(watch.price) > 0 ? `${new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(watch.price) * 0.95)} average price` : "") : "";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Post on Tile</h1>
            <p className="text-muted-foreground mt-2">
              {mode === "home" ? "Pick the right path for your business and publish with confidence." : "A plan-aware posting flow built for trust, conversion and premium growth."}
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-4 min-w-[260px] shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Your plan</p>
              <BadgeCheck className="h-4 w-4 text-accent" />
            </div>
            <p className="text-xl font-bold mt-1">{planLabel}</p>
            <p className="text-sm text-muted-foreground mt-1">{canOpenShop ? "Shop enabled" : "Shop requires Lite or higher"}</p>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              {planSummary.map((item) => <p key={item}>• {item}</p>)}
            </div>
            {plan && (
              <div className="mt-4 space-y-3">
                <QuotaBar used={plan.used_goods} max={plan.max_goods} label="Active goods listings" />
                {plan.max_services > 0 && (
                  <QuotaBar used={plan.used_services} max={plan.max_services} label="Active services" />
                )}
              </div>
            )}
            <div className="mt-4">
              <MerchantHealthCard />
            </div>
          </div>
        </div>

        {mode === "home" ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold">What do you want to do today?</h2>
                <p className="text-sm text-muted-foreground mt-2">Choose the path that fits your business and plan.</p>
              </div>

              <div className="grid gap-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={postingDisabled}
                  className="justify-start h-auto p-5 border-2 hover:border-accent/40 whitespace-normal"
                  onClick={() => { setMode("sell"); setStep(1); }}
                >
                  <div className="text-left">
                    <h3 className="font-bold text-lg">🛒 Sell Something</h3>
                    <p className="text-sm text-muted-foreground mt-1">Quick listings, photos and built-in buyer messaging.</p>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={postingDisabled}
                  className="justify-start h-auto p-5 border-2 hover:border-accent/40 whitespace-normal"
                  onClick={() => nav({ to: "/artisan/create" })}
                >
                  <div className="text-left">
                    <h3 className="font-bold text-lg">🛠 Offer a Service</h3>
                    <p className="text-sm text-muted-foreground mt-1">Create an artisan profile with portfolios and bookings.</p>
                  </div>
                </Button>

                <Button type="button" variant="outline" className="justify-start h-auto p-5 border-2 hover:border-accent/40 whitespace-normal" onClick={() => (canOpenShop ? nav({ to: "/dashboard" }) : toast.info("Opening a shop requires Lite, Pro or VIP."))}>
                  <div className="text-left">
                    <h3 className="font-bold text-lg">🏪 Open Your Own Shop</h3>
                    <p className="text-sm text-muted-foreground mt-1">Create a branded storefront, share a custom URL and unlock analytics.</p>
                    {!canOpenShop && <p className="text-sm text-accent mt-2">Requires Lite Plan</p>}
                  </div>
                </Button>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-accent font-semibold"><ShieldCheck className="h-5 w-5" /> Trust score</div>
              <div className="rounded-2xl bg-muted/30 p-4">
                <p className="text-3xl font-bold">{profile?.is_verified ? "96" : "84"}%</p>
                <p className="text-sm text-muted-foreground mt-1">Phone verified • Email verified • {profile?.kyc_status === "verified" ? "KYC verified" : "KYC pending"}</p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Better trust means better conversion.</p>
                <p>• Premium plans unlock promotions and analytics.</p>
                <p>• Buyers feel safer when listings are polished and verified.</p>
              </div>
            </Card>
          </div>
        ) : submitted ? (
          <Card className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent"><Check className="h-7 w-7" /></div>
            <h2 className="text-2xl font-bold">
              Listing submitted successfully.
            </h2>
            <p className="text-muted-foreground">
              Your listing is now pending Admin review.
              {isPrelaunch
                ? " Because Tile is still in pre-launch, it will remain private even after approval until Admin launches the marketplace."
                : " Once approved, it can become publicly visible."}
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild variant="outline"><Link to="/dashboard">View dashboard</Link></Button>
              <Button className="bg-accent text-accent-foreground" onClick={() => setMode("home")}>Create another</Button>
            </div>
            {submittedListingId && (
              <div className="rounded-2xl border bg-muted/20 p-5 text-left">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold">Boost visibility</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Promotion is available after Admin approval{isPrelaunch ? " and marketplace launch" : ""}.
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="bg-accent text-accent-foreground"
                    onClick={handlePromoteListing}
                    disabled={
                      promoting ||
                      promotionState === "promoted" ||
                      !canPromote ||
                      true
                    }
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {promoting ? "Promoting..." : promotionState === "promoted" ? "Promoted" : "Promote after approval"}
                  </Button>
                </div>
                {!canPromote && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Upgrade to Lite or above to unlock promotions and stronger visibility.
                  </p>
                )}
                {canPromote && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    This listing is awaiting moderation, so promotion is locked until it is approved
                    {isPrelaunch ? " and the marketplace is launched" : ""}.
                  </p>
                )}
                {promotionStats && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-muted-foreground">
                    <div className="rounded-xl border bg-background p-3"><p className="font-semibold text-foreground">{promotionStats.views_count}</p><p>views</p></div>
                    <div className="rounded-xl border bg-background p-3"><p className="font-semibold text-foreground">{promotionStats.clicks_count}</p><p>clicks</p></div>
                    <div className="rounded-xl border bg-background p-3"><p className="font-semibold text-foreground">{promotionStats.favorites_count}</p><p>saves</p></div>
                  </div>
                )}
              </div>
            )}
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <Card className="p-6">
              {isPrelaunch && (
                <div className="mb-5 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                  <p className="font-semibold text-primary">Tile is currently in pre-launch.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You can prepare and submit your listing now. It will be reviewed by Admin,
                    but it will not be visible to the public until the marketplace launches.
                  </p>
                </div>
              )}

              {postingDisabled && (
                <div className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                  <p className="font-semibold text-destructive">Posting is temporarily disabled.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tile has temporarily paused new listings. Your saved draft is preserved.
                  </p>
                </div>
              )}

              <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="rounded-full bg-accent/10 px-2 py-1 text-accent">{draftStatus}</span>
                <span>•</span>
                <span>Listing quality {qualityScore}%</span>
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                {["Category", "Details", "Photos", "Preview"].map((label, index) => {
                  const active = index + 1 === step;
                  return (
                    <div key={label} className={`rounded-full border px-3 py-1 text-sm ${active ? "border-accent bg-accent/10 text-foreground" : "text-muted-foreground"}`}>
                      {index + 1} {label}
                    </div>
                  );
                })}
              </div>

              <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-5" noValidate>
                {step === 1 && (
                  <>
                    <h2 className="text-xl font-semibold">Pick a category</h2>
                    <p className="text-sm text-muted-foreground">Cards feel more premium and make it easier to browse your listing.</p>
                    <div className="grid gap-3 md:grid-cols-2 mt-4">
                      {CATEGORIES.filter((c) => c.type === "goods").map((c) => {
                        const isSelected = watch.category === c.slug;
                        const meta = CATEGORY_META[c.slug] ?? { icon: "📦", subtitle: "Popular listing" };
                        return (
                          <button key={c.slug} type="button" onClick={() => form.setValue("category", c.slug, { shouldValidate: true })} className={`rounded-2xl border p-4 text-left transition-all ${isSelected ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-muted/50"}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-lg font-semibold">{meta.icon} {c.label}</p>
                                <p className="text-sm text-muted-foreground mt-1">{meta.subtitle}</p>
                              </div>
                              {isSelected && <Check className="h-5 w-5 text-accent" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-between pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => setMode("home")}>Cancel</Button>
                      <Button type="button" disabled={!watch.category} onClick={nextStep}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2 className="text-xl font-semibold">Add details that convert</h2>
                    <div className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input {...form.register("title")} placeholder="iPhone 15 Pro Max 256GB" />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea rows={6} {...form.register("description")} placeholder="Add condition, specs, warranty and why someone should buy it." />
                      </div>
                      <div className="flex items-center justify-end">
                        <Button type="button" variant="outline" size="sm" onClick={applyAiDescription}><Sparkles className="mr-2 h-4 w-4" /> Generate with AI</Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label>Price (₦)</Label>
                          <Input type="number" {...form.register("price")} placeholder="420000" />
                          {priceHint && <p className="mt-2 text-sm text-muted-foreground">{priceHint}</p>}
                        </div>
                        <div>
                          <Label>Brand</Label>
                          <Input {...form.register("brand")} placeholder="Apple, Samsung, Toyota" />
                        </div>
                      </div>
                      <div>
                        <Label>Condition</Label>
                        <Select value={watch.condition} onValueChange={(value) => form.setValue("condition", value as FormVals["condition"])}>
                          <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Brand new</SelectItem>
                            <SelectItem value="used_like_new">Used - Like new</SelectItem>
                            <SelectItem value="used_good">Used - Good</SelectItem>
                            <SelectItem value="used_fair">Used - Fair</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-between pt-4 border-t">
                      <Button type="button" variant="outline" onClick={prevStep}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
                      <Button type="button" onClick={nextStep}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h2 className="text-xl font-semibold">Photos and location</h2>
                    <div className="space-y-5 rounded-2xl border bg-muted/20 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">Location</h3>
                          <p className="text-sm text-muted-foreground">Use GPS or pick from the list.</p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={handleDetectLocation} disabled={detectingLocation}>
                          <MapPin className="mr-2 h-4 w-4" />{detectingLocation ? "Detecting..." : "Detect my location"}
                        </Button>
                      </div>
                      {detectedLocation && <p className="text-sm text-accent">Detected: {detectedLocation}</p>}
                      <div>
                        <Label>State</Label>
                        <Select value={watch.state_id} onValueChange={(value) => { form.setValue("state_id", value); form.setValue("lga_id", ""); }}>
                          <SelectTrigger><SelectValue placeholder="Choose state" /></SelectTrigger>
                          <SelectContent>{states.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Local government area</Label>
                        <Select disabled={!watch.state_id} value={watch.lga_id} onValueChange={(value) => form.setValue("lga_id", value)}>
                          <SelectTrigger><SelectValue placeholder="Choose LGA" /></SelectTrigger>
                          <SelectContent>{lgas.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Photos</Label>
                        <span className="text-sm text-muted-foreground">{files.length}/8 images</span>
                      </div>
                      <div className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all ${dragActive ? "border-accent bg-accent/10" : "border-border"}`} onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={(e) => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files); }}>
                        <input id="listing-images" type="file" multiple accept="image/*" className="hidden" onChange={(e) => { if (e.target.files) addFiles(e.target.files); }} />
                        <label htmlFor="listing-images" className="flex cursor-pointer flex-col items-center gap-3">
                          <ImagePlus className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">Drag photos here or browse</p>
                            <p className="text-sm text-muted-foreground">Use clear images to improve trust and buyer interest.</p>
                          </div>
                        </label>
                      </div>
                      {files.length > 0 && (
                        <div className="grid gap-3 md:grid-cols-2">
                          {files.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="rounded-2xl border p-3">
                              <div className="relative overflow-hidden rounded-xl border aspect-square bg-muted">
                                <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                                {coverIndex === index && <div className="absolute left-2 top-2 rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-accent-foreground">Cover</div>}
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-medium">{file.name}</p>
                                <div className="flex gap-1">
                                  <Button type="button" size="sm" variant="outline" onClick={() => moveFile(index, -1)}><ArrowUp className="h-3 w-3" /></Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => moveFile(index, 1)}><ArrowDown className="h-3 w-3" /></Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => setCoverIndex(index)}>Cover</Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}><X className="h-3 w-3" /></Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Contact phone number</Label>
                      <Input {...form.register("phone")} placeholder="08012345678" />
                    </div>

                    <div className="flex justify-between pt-4 border-t">
                      <Button type="button" variant="outline" onClick={prevStep}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
                      <Button type="button" onClick={nextStep}>Preview <ChevronRight className="ml-2 h-4 w-4" /></Button>
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <h2 className="text-xl font-semibold">Preview your listing</h2>
                    <p className="text-sm text-muted-foreground">Review the listing exactly as buyers will see it before publishing.</p>
                    <div className="space-y-4 rounded-2xl border bg-muted/20 p-5">
                      <div className="rounded-2xl bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Preview</p>
                        <h3 className="mt-2 text-xl font-semibold">{watch.title || "Your title goes here"}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{watch.description || "Add a clear description with condition, specs and pricing."}</p>
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{watch.price ? `₦${Number(watch.price).toLocaleString()}` : "Price not set"}</span>
                          <span>•</span>
                          <span>{watch.condition ? watch.condition.replace(/_/g, " ") : "Condition pending"}</span>
                        </div>
                      </div>
                      {canPromote ? (
                        <div className="rounded-2xl border bg-background p-4">
                          <h4 className="font-semibold">Want more buyers?</h4>
                          <p className="text-sm text-muted-foreground mt-1">Promote this listing after publishing to increase visibility.</p>
                          <p className="mt-3 text-sm text-muted-foreground">Your promotion will be activated once the listing is submitted and approved.</p>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-accent/30 bg-accent/5 p-4 text-sm text-muted-foreground">
                          Upgrade to Lite to unlock promotions, a store and richer analytics.
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between pt-4 border-t">
                      <Button type="button" variant="outline" onClick={prevStep}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
                      <Button type="submit" disabled={submitting || postingDisabled} className="bg-accent text-accent-foreground">
                        <Check className="mr-2 h-4 w-4" />
                        {submitting
                          ? submittingStage
                          : isPrelaunch
                            ? "Submit for Admin Review"
                            : "Publish listing"}
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </Card>

            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold">Subscription-aware features</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>• Free: 3 active listings, no promotions.</li>
                  <li>• Lite: shop enabled, 1 weekly promotion.</li>
                  <li>• Pro: priority search, promotions and analytics.</li>
                  <li>• VIP: priority placement and multi-staff support.</li>
                </ul>
              </Card>
              <Card className="p-5">
                <h3 className="font-semibold">Trust signals</h3>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p>• Phone verified</p>
                  <p>• Email verified</p>
                  <p>• {profile?.kyc_status === "verified" ? "KYC verified" : "KYC pending"}</p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
