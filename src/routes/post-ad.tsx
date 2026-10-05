import { rpcUntyped } from "@/lib/waitlist-rpc";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import { useAuth } from "@/lib/auth-context";
import { usePlan, hasCapability } from "@/hooks/use-plan";
import { useTileEntitlements, hasUnlimitedListings } from "@/hooks/use-tile-entitlements";
import { useMerchantStaffContext } from "@/hooks/use-merchant-staff-context";
import { MerchantHealthCard, QuotaBar } from "@/components/merchant-health";
import { supabase } from "@/integrations/supabase/client";
import { uploadListingImages } from "@/lib/storage";
import { optimizeListingImage } from "@/lib/listing-image";
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
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/post-ad")({
  head: () => ({
    meta: [{ title: "Post an Ad — Tile" }],
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
  phone: z.string().min(7, "Enter a phone number with at least 7 digits"),
  price: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().positive("Enter a price greater than zero").optional(),
  ),
  condition: z.enum(["new", "used_like_new", "used_good", "used_fair"]).optional(),
  brand: z.string().optional(),
});

type FormVals = z.infer<typeof schema>;

type Mode = "home" | "sell";
type ListingPhoto = { id: string; file: File; previewUrl: string };

const DRAFT_KEY = "tile-post-ad-draft";
const MAX_PHOTO_SIZE = 30 * 1024 * 1024;
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
  const staffContextQuery = useMerchantStaffContext(user?.id);
  const isMerchantStaff = staffContextQuery.data?.is_staff === true;
  const merchantOwnerId = isMerchantStaff ? staffContextQuery.data?.owner_id : user?.id;

  const [mode, setMode] = useState<Mode>("home");
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(null);
  const [isPreparingPhotos, setIsPreparingPhotos] = useState(false);
  const [photoPreparation, setPhotoPreparation] = useState<{
    completed: number;
    total: number;
  } | null>(null);
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
  const ownedPreviewUrls = useRef(new Set<string>());
  const isPreparingPhotosRef = useRef(false);

  useEffect(
    () => () => {
      ownedPreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      ownedPreviewUrls.current.clear();
    },
    [],
  );

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "",
      title: "",
      description: "",
      state_id: "",
      lga_id: "",
      phone: profile?.phone ?? "",
      price: undefined,
      condition: undefined,
      brand: "",
    },
  });
  const watch = form.watch();

  const { data: states = [] } = useQuery({
    queryKey: ["post-states"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("states")
        .select("id, name")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: lgas = [] } = useQuery({
    queryKey: ["post-lgas", watch.state_id],
    queryFn: async () => {
      if (!watch.state_id) return [];
      const { data, error } = await supabase
        .from("lgas")
        .select("id, name")
        .eq("state_id", watch.state_id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!watch.state_id,
  });

  const { data: plan } = usePlan();
  const { data: entitlements } = useTileEntitlements();
  const unlimitedListings = hasUnlimitedListings(entitlements);

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
    if (photos.length >= 2) score += 10;
    if (photos.length >= 4) score += 10;
    return Math.min(score, 100);
  }, [photos.length, watch.brand, watch.condition, watch.description, watch.price, watch.title]);

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
  }, [
    form,
    user,
    watch.category,
    watch.title,
    watch.description,
    watch.state_id,
    watch.lga_id,
    watch.phone,
    watch.price,
    watch.condition,
    watch.brand,
  ]);

  const nextStep = () => {
    if (step < 4) setStep((s) => s + 1);
  };

  const prevStep = () => {
    if (step > 1) goToStep(step - 1);
  };

  const validateStepFields = async (fields: Array<keyof FormVals>, message: string) => {
    if (await form.trigger(fields)) return true;

    const firstInvalid = fields.find((field) => form.getFieldState(field).error);
    const fieldError = firstInvalid ? form.getFieldState(firstInvalid).error?.message : undefined;
    toast.error(fieldError ?? message);
    if (firstInvalid) focusFormField(formRef.current, firstInvalid);
    return false;
  };

  const handleCategoryNext = async () => {
    if (await validateStepFields(["category"], "Choose a category before continuing.")) goToStep(2);
  };

  const handleDetailsNext = async () => {
    if (
      await validateStepFields(
        ["title", "description", "price"],
        "Add a title and description before continuing.",
      )
    )
      goToStep(3);
  };

  const handlePreviewNext = async () => {
    if (isPreparingPhotos) {
      toast.error("Please wait while your photos are being prepared.");
      return;
    }
    if (submitting) return;
    if (
      await validateStepFields(
        ["state_id", "lga_id", "phone"],
        "Add your location and contact number before previewing.",
      )
    )
      goToStep(4);
  };

  const returnToChoice = () => {
    setMode("home");
    setStep(1);
    setSubmitted(false);
    setSubmittedListingId(null);
    scrollPageToTop();
  };

  const addPhotos = async (incoming: FileList | File[]) => {
    if (isPreparingPhotosRef.current || submitting) return;

    const selected = Array.from(incoming);
    const imageFiles = selected.filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) {
      toast.error("Choose one or more image files to add photos.");
      return;
    }
    if (imageFiles.length < selected.length) {
      toast.error("Some files weren't images and were skipped.");
    }
    const supportedFiles = imageFiles.filter(
      (file) =>
        ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) ||
        /\.(jpe?g|png|webp|avif)$/i.test(file.name),
    );
    if (supportedFiles.length < imageFiles.length) {
      toast.error("Export Photoshop or RAW photos as JPG, PNG, WebP, or AVIF before adding them.");
    }
    if (!supportedFiles.length) return;

    const remaining = Math.max(0, 8 - photos.length);
    if (!remaining) {
      toast.error("You can add up to 8 photos to a listing.");
      return;
    }
    if (supportedFiles.length > remaining) {
      toast.error(`You can add ${remaining} more photo${remaining === 1 ? "" : "s"}.`);
    }

    const candidates = supportedFiles.slice(0, remaining);
    const manageableFiles = candidates.filter((file) => file.size <= MAX_PHOTO_SIZE);
    if (manageableFiles.length < candidates.length) {
      toast.error(
        "Photos must be 30 MB or smaller. Export or resize the larger files, then try again.",
      );
    }
    if (!manageableFiles.length) return;

    isPreparingPhotosRef.current = true;
    setIsPreparingPhotos(true);
    setPhotoPreparation({ completed: 0, total: manageableFiles.length });
    const prepared: ListingPhoto[] = [];

    try {
      for (const [index, file] of manageableFiles.entries()) {
        const optimizedFile = await optimizeListingImage(file);
        const previewUrl = URL.createObjectURL(optimizedFile);
        ownedPreviewUrls.current.add(previewUrl);
        prepared.push({ id: crypto.randomUUID(), file: optimizedFile, previewUrl });
        setPhotoPreparation({ completed: index + 1, total: manageableFiles.length });
      }

      setPhotos((current) => [...current, ...prepared].slice(0, 8));
      setCoverPhotoId((current) => current ?? prepared[0]?.id ?? null);
    } catch {
      prepared.forEach(({ previewUrl }) => {
        URL.revokeObjectURL(previewUrl);
        ownedPreviewUrls.current.delete(previewUrl);
      });
      toast.error("We couldn't prepare one of those photos. Try a JPG, PNG, or WebP image.");
    } finally {
      isPreparingPhotosRef.current = false;
      setIsPreparingPhotos(false);
      setPhotoPreparation(null);
    }
  };

  const movePhoto = (from: number, direction: -1 | 1) => {
    setPhotos((prev) => {
      const next = [...prev];
      const target = from + direction;
      if (target < 0 || target >= next.length) return prev;
      const [item] = next.splice(from, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const removePhoto = (photoId: string) => {
    const photo = photos.find((item) => item.id === photoId);
    if (photo) {
      URL.revokeObjectURL(photo.previewUrl);
      ownedPreviewUrls.current.delete(photo.previewUrl);
    }
    setPhotos((current) => current.filter((item) => item.id !== photoId));
    if (coverPhotoId === photoId) {
      setCoverPhotoId(photos.find((item) => item.id !== photoId)?.id ?? null);
    }
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
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          );
          const json = await res.json();
          const address = json?.address ?? {};
          const place = [
            address.city,
            address.town,
            address.village,
            address.state,
            address.country,
          ]
            .filter(Boolean)
            .join(", ");
          setDetectedLocation(place || "Location detected");
          const normalized = (value: string) =>
            value
              .toLowerCase()
              .replace(/state|city|town|province|lga/g, "")
              .trim();
          const matchedState = states.find(
            (s) =>
              normalized(s.name).includes(normalized(place)) ||
              normalized(place).includes(normalized(s.name)),
          );
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
    if (staffContextQuery.isLoading) {
      toast.error("Checking your merchant workspace. Please try again in a moment.");
      return;
    }
    if (!merchantOwnerId) {
      toast.error("Your merchant workspace couldn't be verified. Contact the account owner.");
      return;
    }
    if (isPreparingPhotosRef.current) {
      toast.error("Please wait while your photos are being prepared.");
      return;
    }

    if (postingDisabled) {
      toast.error("Posting is temporarily disabled by Tile.");
      return;
    }
    setSubmitting(true);
    setSubmittingStage("Checking plan limits");
    try {
      if (!unlimitedListings) {
        const { data: ok, error: qErr } = await supabase.rpc("check_post_quota", {
          _type: "goods",
        });
        if (qErr) throw qErr;
        if (!ok) {
          toast.error("Your current plan has reached the listing limit.");
          setSubmitting(false);
          return;
        }
      }

      setSubmittingStage("Uploading photos");
      let imagePaths: string[] = [];
      if (photos.length) {
        const coverIndex = photos.findIndex((photo) => photo.id === coverPhotoId);
        const orderedPhotos =
          coverIndex > 0
            ? [photos[coverIndex], ...photos.filter((_, index) => index !== coverIndex)]
            : photos;
        imagePaths = await uploadListingImages(
          merchantOwnerId,
          orderedPhotos.map((photo) => photo.file),
          (uploaded, total) => setSubmittingStage(`Uploading photo ${uploaded} of ${total}`),
        );
      }

      const selectedState = states.find((s) => s.id === vals.state_id);
      const selectedLga = lgas.find((l) => l.id === vals.lga_id);
      const location = [selectedLga?.name, selectedState?.name].filter(Boolean).join(", ");

      setSubmittingStage("Submitting for review");
      const { data, error } = await supabase
        .from("listings")
        .insert({
          user_id: merchantOwnerId,
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

  const onInvalid = (errors: FieldErrors<FormInput>) => {
    const first = Object.keys(errors)[0] as keyof FormInput | undefined;
    if (!first) return;
    const message = errors[first]?.message;
    toast.error(
      typeof message === "string"
        ? message
        : "Please complete the required listing fields before publishing.",
    );
    const isDetailsField = (
      ["title", "description", "price", "condition", "brand"] as (keyof FormInput)[]
    ).includes(first);
    const targetStep = first === "category" ? 1 : isDetailsField ? 2 : 3;
    if (targetStep !== step) {
      setStep(targetStep);
      focusFormFieldAfterRender(formRef.current, first);
      return;
    }
  };

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto py-20 text-center">
          <h1 className="text-2xl font-bold">Sign in to post an ad</h1>
          <Button asChild className="mt-4 bg-accent text-accent-foreground">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  const planSummary = [
    tier === "free" ? "3 listings" : "Unlimited listings",
    tier === "free"
      ? "No promotions"
      : tier === "lite"
        ? "1 promotion weekly"
        : "Multiple promotions",
    canOpenShop ? "Shop enabled" : "Shop locked",
    tier === "free" ? "Basic chat" : "Premium messaging",
  ];

  const priceHint = watch.price
    ? Number(watch.price) > 0
      ? `${new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(watch.price) * 0.95)} average price`
      : ""
    : "";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Post on Tile</h1>
            <p className="text-muted-foreground mt-2">
              {mode === "home"
                ? "Pick the right path for your business and publish with confidence."
                : "A plan-aware posting flow built for trust, conversion and premium growth."}
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-4 min-w-[260px] shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Your plan</p>
              <BadgeCheck className="h-4 w-4 text-accent" />
            </div>
            <p className="text-xl font-bold mt-1">{planLabel}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {canOpenShop ? "Shop enabled" : "Shop requires Lite or higher"}
            </p>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              {planSummary.map((item) => (
                <p key={item}>• {item}</p>
              ))}
            </div>
            {unlimitedListings ? (
              <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-3.5">
                <p className="text-xs font-medium text-emerald-100">Listing allowance</p>
                <p className="mt-1 text-sm font-semibold text-white">Unlimited listings</p>
              </div>
            ) : (
              plan && (
                <div className="mt-4 space-y-3">
                  <QuotaBar
                    used={plan.used_goods}
                    max={plan.max_goods}
                    label="Active goods listings"
                  />
                  {plan.max_services > 0 && (
                    <QuotaBar
                      used={plan.used_services}
                      max={plan.max_services}
                      label="Active services"
                    />
                  )}
                </div>
              )
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
                <p className="text-sm text-muted-foreground mt-2">
                  Choose the path that fits your business and plan.
                </p>
              </div>

              <div className="grid gap-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={postingDisabled}
                  className="justify-start h-auto p-5 border-2 hover:border-accent/40 whitespace-normal"
                  onClick={() => {
                    setMode("sell");
                    setStep(1);
                    scrollPageToTop();
                  }}
                >
                  <div className="text-left">
                    <h3 className="font-bold text-lg">🛒 Sell Something</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Quick listings, photos and built-in buyer messaging.
                    </p>
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
                    <p className="text-sm text-muted-foreground mt-1">
                      Create an artisan profile with portfolios and bookings.
                    </p>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="justify-start h-auto p-5 border-2 hover:border-accent/40 whitespace-normal"
                  onClick={() =>
                    canOpenShop
                      ? nav({ to: "/dashboard" })
                      : toast.info("Opening a shop requires Lite, Pro or VIP.")
                  }
                >
                  <div className="text-left">
                    <h3 className="font-bold text-lg">🏪 Open Your Own Shop</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create a branded storefront, share a custom URL and unlock analytics.
                    </p>
                    {!canOpenShop && <p className="text-sm text-accent mt-2">Requires Lite Plan</p>}
                  </div>
                </Button>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-accent font-semibold">
                <ShieldCheck className="h-5 w-5" /> Trust score
              </div>
              <div className="rounded-2xl bg-muted/30 p-4">
                <p className="text-3xl font-bold">{profile?.is_verified ? "96" : "84"}%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Phone verified • Email verified •{" "}
                  {profile?.kyc_status === "verified" ? "KYC verified" : "KYC pending"}
                </p>
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
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Check className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold">Listing submitted successfully.</h2>
            <p className="text-muted-foreground">
              Your listing is now pending Admin review.
              {isPrelaunch
                ? " Because Tile is still in pre-launch, it will remain private even after approval until Admin launches the marketplace."
                : " Once approved, it can become publicly visible."}
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild variant="outline">
                <Link to="/dashboard">View dashboard</Link>
              </Button>
              <Button className="bg-accent text-accent-foreground" onClick={returnToChoice}>
                Create another
              </Button>
            </div>
            {submittedListingId && (
              <div className="rounded-2xl border bg-muted/20 p-5 text-left">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold">Top Ads after approval</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Once approved, manage this listing and check your Top Ad allowance in the
                      Merchant Hub.
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
                    You can prepare and submit your listing now. It will be reviewed by Admin, but
                    it will not be visible to the public until the marketplace launches.
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
                <span className="rounded-full bg-accent/10 px-2 py-1 text-accent">
                  {draftStatus}
                </span>
                <span>•</span>
                <span>Listing quality {qualityScore}%</span>
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                {["Category", "Details", "Photos", "Preview"].map((label, index) => {
                  const active = index + 1 === step;
                  return (
                    <div
                      key={label}
                      className={`rounded-full border px-3 py-1 text-sm ${active ? "border-accent bg-accent/10 text-foreground" : "text-muted-foreground"}`}
                    >
                      {index + 1} {label}
                    </div>
                  );
                })}
              </div>

              <form
                ref={formRef}
                onSubmit={form.handleSubmit(onSubmit, onInvalid)}
                className="space-y-5"
                noValidate
              >
                {step === 1 && (
                  <>
                    <h2 className="text-xl font-semibold">
                      Pick a category <span className="text-destructive">*</span>
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Cards feel more premium and make it easier to browse your listing.
                    </p>
                    <div data-field="category" className="grid gap-3 md:grid-cols-2 mt-4">
                      {CATEGORIES.filter((c) => c.type === "goods").map((c) => {
                        const isSelected = watch.category === c.slug;
                        const meta = CATEGORY_META[c.slug] ?? {
                          icon: "📦",
                          subtitle: "Popular listing",
                        };
                        return (
                          <button
                            key={c.slug}
                            type="button"
                            onClick={() =>
                              form.setValue("category", c.slug, { shouldValidate: true })
                            }
                            className={`rounded-2xl border p-4 text-left transition-all ${isSelected ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-muted/50"}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-lg font-semibold">
                                  {meta.icon} {c.label}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {meta.subtitle}
                                </p>
                              </div>
                              {isSelected && <Check className="h-5 w-5 text-accent" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {form.formState.errors.category && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.category.message}
                      </p>
                    )}
                    <div className="flex justify-between pt-4 border-t">
                      <Button type="button" variant="outline" onClick={returnToChoice}>
                        Cancel
                      </Button>
                      <Button type="button" onClick={handleCategoryNext}>
                        Next <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2 className="text-xl font-semibold">Add details that convert</h2>
                    <div className="space-y-4">
                      <div>
                        <Label>
                          Title <span className="text-destructive">*</span>
                        </Label>
                        <Input {...form.register("title")} placeholder="iPhone 15 Pro Max 256GB" />
                        {form.formState.errors.title && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.title.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>
                          Description <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          rows={6}
                          {...form.register("description")}
                          placeholder="Add condition, specs, warranty and why someone should buy it."
                        />
                        {form.formState.errors.description && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.description.message}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={applyAiDescription}
                        >
                          <Sparkles className="mr-2 h-4 w-4" /> Generate with AI
                        </Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label>Price (₦)</Label>
                          <Input type="number" {...form.register("price")} placeholder="420000" />
                          {form.formState.errors.price && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.price.message}
                            </p>
                          )}
                          {priceHint && (
                            <p className="mt-2 text-sm text-muted-foreground">{priceHint}</p>
                          )}
                        </div>
                        <div>
                          <Label>Brand</Label>
                          <Input {...form.register("brand")} placeholder="Apple, Samsung, Toyota" />
                        </div>
                      </div>
                      <div>
                        <Label>Condition</Label>
                        <Select
                          value={watch.condition}
                          onValueChange={(value) =>
                            form.setValue("condition", value as FormVals["condition"])
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
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
                      <Button type="button" variant="outline" onClick={prevStep}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button type="button" onClick={handleDetailsNext}>
                        Next <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
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
                          <p className="text-sm text-muted-foreground">
                            Use GPS or pick from the list.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleDetectLocation}
                          disabled={detectingLocation}
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          {detectingLocation ? "Detecting..." : "Detect my location"}
                        </Button>
                      </div>
                      {detectedLocation && (
                        <p className="text-sm text-accent">Detected: {detectedLocation}</p>
                      )}
                      <div data-field="state_id">
                        <Label>
                          State <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={watch.state_id}
                          onValueChange={(value) => {
                            form.setValue("state_id", value, { shouldValidate: true });
                            form.setValue("lga_id", "", { shouldValidate: true });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose state" />
                          </SelectTrigger>
                          <SelectContent>
                            {states.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.state_id && (
                          <p className="mt-1 text-sm text-destructive">
                            {form.formState.errors.state_id.message}
                          </p>
                        )}
                      </div>
                      <div data-field="lga_id">
                        <Label>
                          Local government area <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          disabled={!watch.state_id}
                          value={watch.lga_id}
                          onValueChange={(value) =>
                            form.setValue("lga_id", value, { shouldValidate: true })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose LGA" />
                          </SelectTrigger>
                          <SelectContent>
                            {lgas.map((l) => (
                              <SelectItem key={l.id} value={l.id}>
                                {l.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.lga_id && (
                          <p className="mt-1 text-sm text-destructive">
                            {form.formState.errors.lga_id.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Photos</Label>
                        <span className="text-sm text-muted-foreground">
                          {photos.length}/8 images
                        </span>
                      </div>
                      <div
                        className={`rounded-2xl border-2 border-dashed p-5 text-center transition-all sm:p-6 ${dragActive ? "border-accent bg-accent/10" : "border-border"} ${isPreparingPhotos || submitting ? "opacity-70" : ""}`}
                        onDragOver={(event) => {
                          event.preventDefault();
                          if (!isPreparingPhotos && !submitting) setDragActive(true);
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(event) => {
                          event.preventDefault();
                          setDragActive(false);
                          if (!isPreparingPhotos && !submitting)
                            void addPhotos(event.dataTransfer.files);
                        }}
                      >
                        <input
                          id="listing-images"
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          className="hidden"
                          disabled={isPreparingPhotos || submitting}
                          onChange={(event) => {
                            if (event.target.files) void addPhotos(Array.from(event.target.files));
                            event.target.value = "";
                          }}
                        />
                        <label
                          htmlFor="listing-images"
                          aria-disabled={isPreparingPhotos || submitting}
                          className={`flex flex-col items-center gap-3 ${isPreparingPhotos || submitting ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          {isPreparingPhotos ? (
                            <Loader2 className="h-8 w-8 animate-spin text-accent" />
                          ) : (
                            <ImagePlus className="h-8 w-8 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-semibold">
                              {isPreparingPhotos
                                ? "Optimizing your photos…"
                                : "Drag photos here or browse"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {isPreparingPhotos && photoPreparation
                                ? `Preparing photo ${photoPreparation.completed} of ${photoPreparation.total}`
                                : "Photos are resized for faster uploads and smoother browsing on mobile."}
                            </p>
                          </div>
                        </label>
                      </div>
                      {photos.length > 0 && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {photos.map((photo, index) => (
                            <div key={photo.id} className="min-w-0 rounded-2xl border p-2.5 sm:p-3">
                              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
                                <img
                                  src={photo.previewUrl}
                                  alt=""
                                  decoding="async"
                                  loading="lazy"
                                  className="h-full w-full object-cover"
                                />
                                {coverPhotoId === photo.id && (
                                  <div className="absolute left-2 top-2 rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-accent-foreground">
                                    Cover photo
                                  </div>
                                )}
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <p
                                  className="min-w-0 truncate text-xs font-medium text-muted-foreground"
                                  title={photo.file.name}
                                >
                                  {photo.file.name}
                                </p>
                                <div className="flex shrink-0 gap-1">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    aria-label={`Move ${photo.file.name} earlier`}
                                    disabled={index === 0 || isPreparingPhotos || submitting}
                                    onClick={() => movePhoto(index, -1)}
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    aria-label={`Move ${photo.file.name} later`}
                                    disabled={
                                      index === photos.length - 1 || isPreparingPhotos || submitting
                                    }
                                    onClick={() => movePhoto(index, 1)}
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={coverPhotoId === photo.id ? "secondary" : "outline"}
                                    className="h-8 px-2 text-xs"
                                    disabled={isPreparingPhotos || submitting}
                                    onClick={() => setCoverPhotoId(photo.id)}
                                  >
                                    {coverPhotoId === photo.id ? "Cover" : "Set cover"}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    aria-label={`Remove ${photo.file.name}`}
                                    disabled={isPreparingPhotos || submitting}
                                    onClick={() => removePhoto(photo.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>
                        Contact phone number <span className="text-destructive">*</span>
                      </Label>
                      <Input {...form.register("phone")} placeholder="08012345678" />
                      {form.formState.errors.phone && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between pt-4 border-t">
                      <Button type="button" variant="outline" onClick={prevStep}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button type="button" onClick={handlePreviewNext}>
                        Preview <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <h2 className="text-xl font-semibold">Preview your listing</h2>
                    <p className="text-sm text-muted-foreground">
                      Review the listing exactly as buyers will see it before publishing.
                    </p>
                    <div className="space-y-4 rounded-2xl border bg-muted/20 p-5">
                      <div className="rounded-2xl bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                          Preview
                        </p>
                        <h3 className="mt-2 text-xl font-semibold">
                          {watch.title || "Your title goes here"}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {watch.description ||
                            "Add a clear description with condition, specs and pricing."}
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            {watch.price
                              ? `₦${Number(watch.price).toLocaleString()}`
                              : "Price not set"}
                          </span>
                          <span>•</span>
                          <span>
                            {watch.condition
                              ? watch.condition.replace(/_/g, " ")
                              : "Condition pending"}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-dashed border-accent/30 bg-accent/5 p-4">
                        <h4 className="font-semibold">After admin review</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          When this listing is approved, you can manage it and check Top Ad access
                          in your Merchant Hub.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between pt-4 border-t">
                      <Button type="button" variant="outline" onClick={prevStep}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting || postingDisabled || isPreparingPhotos}
                        className="bg-accent text-accent-foreground"
                      >
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
                <h3 className="font-semibold">Manage your business</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your active plan features and Top Ad allowance are shown in your Merchant Hub.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-3">
                  <Link to="/dashboard">Open Merchant Hub</Link>
                </Button>
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
