import { rpcUntyped } from "@/lib/waitlist-rpc";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { CATEGORIES, formatNaira } from "@/lib/categories";
import { useAuth } from "@/lib/auth-context";
import { usePlan, hasCapability } from "@/hooks/use-plan";
import { useTileEntitlements, hasUnlimitedListings } from "@/hooks/use-tile-entitlements";
import { useMerchantStaffContext } from "@/hooks/use-merchant-staff-context";
import { MerchantHealthCard, QuotaBar } from "@/components/merchant-health";
import { supabase } from "@/integrations/supabase/client";
import { optimizeListingImage } from "@/lib/listing-image";
import { toast } from "sonner";
import { showError } from "@/lib/user-feedback";
import { focusFormField, focusFormFieldAfterRender, scrollPageToTop } from "@/lib/form-navigation";
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
  validateSearch: z.object({ type: z.literal("goods").optional() }),
  head: () => ({
    meta: [{ title: "Post an Ad — Tile Marketplace" }],
    links: [
      {
        rel: "icon",
        href: "/tile-marketplace-logo.jpeg",
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

type FormInput = z.input<typeof schema>;
type FormVals = z.output<typeof schema>;

type Mode = "home" | "sell";
type ListingPhoto = { id: string; file: File; previewUrl: string };
type DraftProduct = {
  id: string;
  values: FormVals;
  photos: ListingPhoto[];
  coverPhotoId: string | null;
  location: string;
};

const DRAFT_KEY = "tile-post-ad-draft";
const MAX_PHOTO_SIZE = 30 * 1024 * 1024;
const CATEGORY_META: Record<string, { icon: string; subtitle: string }> = {
  phones: { icon: "", subtitle: "Electronics, mobile and accessories" },
  fashion: { icon: "", subtitle: "Style, wearables and beauty" },
  cars: { icon: "", subtitle: "Vehicles and auto gear" },
  property: { icon: "", subtitle: "Homes, apartments and rentals" },
  furniture: { icon: "", subtitle: "Interior pieces and decor" },
  electronics: { icon: "", subtitle: "Laptops, consoles and gadgets" },
};

function PostAd() {
  const search = Route.useSearch();
  const { user, loading, profile } = useAuth();
  const queryClient = useQueryClient();
  const nav = useNavigate();
  const staffContextQuery = useMerchantStaffContext(user?.id);
  const isMerchantStaff = staffContextQuery.data?.is_staff === true;
  const merchantOwnerId = isMerchantStaff ? staffContextQuery.data?.owner_id : user?.id;

  const [mode, setMode] = useState<Mode>(search.type === "goods" ? "sell" : "home");
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);
  const [batchProducts, setBatchProducts] = useState<DraftProduct[]>([]);
  const [editingBatchProductId, setEditingBatchProductId] = useState<string | null>(null);
  const [submittedListingCount, setSubmittedListingCount] = useState(0);
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
  const [promotionStats, setPromotionStats] = useState<{
    views_count: number;
    clicks_count: number;
    favorites_count: number;
  } | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const ownedPreviewUrls = useRef(new Set<string>());
  const isPreparingPhotosRef = useRef(false);

  useEffect(() => {
    if (search.type === "goods") {
      setMode("sell");
      setStep(1);
    }
  }, [search.type]);

  useEffect(
    () => () => {
      ownedPreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      ownedPreviewUrls.current.clear();
    },
    [],
  );

  const form = useForm<FormInput, unknown, FormVals>({
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

  const goToStep = (nextStep: number) => {
    setStep(nextStep);
    scrollPageToTop();
  };

  const nextStep = () => {
    if (step < 4) goToStep(step + 1);
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
    if (search.type === "goods") {
      void nav({ to: "/post-ad", search: {} });
    }
    setMode("home");
    setStep(1);
    setSubmitted(false);
    setSubmittedListingId(null);
    setSubmittedListingCount(0);
    ownedPreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    ownedPreviewUrls.current.clear();
    setBatchProducts([]);
    setEditingBatchProductId(null);
    setPhotos([]);
    setCoverPhotoId(null);
    scrollPageToTop();
  };

  const createDraftProduct = (values: FormVals): DraftProduct => {
    const selectedState = states.find((state) => state.id === values.state_id);
    const selectedLga = lgas.find((lga) => lga.id === values.lga_id);
    return {
      id: editingBatchProductId ?? crypto.randomUUID(),
      values: { ...values },
      photos: [...photos],
      coverPhotoId,
      location: [selectedLga?.name, selectedState?.name].filter(Boolean).join(", "),
    };
  };

  const handleAddAnotherProduct = (values: FormVals) => {
    if (isPreparingPhotosRef.current || submitting) return;
    const draft = createDraftProduct(values);
    setBatchProducts((current) =>
      editingBatchProductId
        ? current.map((product) => (product.id === editingBatchProductId ? draft : product))
        : [...current, draft],
    );
    form.reset({
      category: "",
      title: "",
      description: "",
      state_id: values.state_id,
      lga_id: values.lga_id,
      phone: values.phone,
      price: undefined,
      condition: undefined,
      brand: "",
    });
    setPhotos([]);
    setCoverPhotoId(null);
    setEditingBatchProductId(null);
    setDetectedLocation(null);
    goToStep(1);
    toast.success("Product added to your batch. Add the next one.");
  };

  const handleSwitchBatchProduct = (product: DraftProduct, currentValues: FormVals) => {
    if (product.id === editingBatchProductId) return;
    const currentDraft = createDraftProduct(currentValues);
    setBatchProducts((current) =>
      editingBatchProductId
        ? current.map((item) => (item.id === editingBatchProductId ? currentDraft : item))
        : [...current, currentDraft],
    );
    form.reset(product.values);
    setPhotos(product.photos);
    setCoverPhotoId(product.coverPhotoId);
    setEditingBatchProductId(product.id);
    setDetectedLocation(null);
    goToStep(1);
  };

  const removeBatchProduct = (productId: string) => {
    const product = batchProducts.find((item) => item.id === productId);
    if (!product) return;
    product.photos.forEach((photo) => {
      URL.revokeObjectURL(photo.previewUrl);
      ownedPreviewUrls.current.delete(photo.previewUrl);
    });
    setBatchProducts((current) => current.filter((item) => item.id !== productId));
    if (editingBatchProductId === productId) {
      form.reset({
        category: "",
        title: "",
        description: "",
        state_id: watch.state_id,
        lga_id: watch.lga_id,
        phone: watch.phone,
        price: undefined,
        condition: undefined,
        brand: "",
      });
      setPhotos([]);
      setCoverPhotoId(null);
      setEditingBatchProductId(null);
      setDetectedLocation(null);
      goToStep(1);
    }
    toast.success("Product removed from your batch.");
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
    const row = (data ?? [])[0] as
      { views_count: number; clicks_count: number; favorites_count: number } | undefined;
    if (row) {
      setPromotionStats({
        views_count: row.views_count,
        clicks_count: row.clicks_count,
        favorites_count: Number(row.favorites_count),
      });
    }
  };

  const handlePromoteListing = async () => {
    if (!user || !submittedListingId) return;
    setPromoting(true);
    try {
      const { data, error } = await (
        supabase.rpc as unknown as (
          fn: string,
          args: Record<string, unknown>,
        ) => Promise<{ data: boolean | null; error: { message: string } | null }>
      )("promote_listing", {
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

    const currentProduct = createDraftProduct(vals);
    const productsToSubmit = editingBatchProductId
      ? batchProducts.map((product) =>
          product.id === editingBatchProductId ? currentProduct : product,
        )
      : [...batchProducts, currentProduct];

    if (!productsToSubmit.length) {
      toast.error("Add at least one product before submitting.");
      return;
    }

    setSubmitting(true);
    const uploadedPaths: string[] = [];
    let listingsInserted = false;

    try {
      setSubmittingStage("Checking your listing allowance");
      const { data: planRows, error: planError } = await supabase.rpc("get_plan_limits");
      if (planError) throw planError;
      const quota = (Array.isArray(planRows) ? planRows[0] : planRows) as
        | { tier?: string; max_goods?: number | null; used_goods?: number | null }
        | null;
      if (!quota) throw new Error("We couldn't verify your listing allowance. Please try again.");

      const paidTier = ["lite", "pro", "vip"].includes(String(quota.tier ?? "").toLowerCase());
      if (!paidTier && !unlimitedListings) {
        const { data: canPost, error: quotaError } = await supabase.rpc("check_post_quota", {
          _type: "goods",
        });
        if (quotaError) throw quotaError;

        const maxGoods = Number(quota.max_goods ?? 5);
        const usedGoods = Number(quota.used_goods ?? 0);
        const remaining = Math.max(0, Math.min(maxGoods, 5) - usedGoods);
        if (!canPost || productsToSubmit.length > remaining) {
          throw new Error(
            remaining > 0 && productsToSubmit.length > remaining
              ? `Your Free plan has room for ${remaining} more product listing${remaining === 1 ? "" : "s"}. Remove ${productsToSubmit.length - remaining} product${productsToSubmit.length - remaining === 1 ? "" : "s"} from this batch or upgrade your plan.`
              : "Your Free plan has reached its 5-product listing limit. Upgrade your plan to submit more products.",
          );
        }
      }

      const listingRows: Array<{
        user_id: string;
        type: "goods";
        category: string;
        title: string;
        description: string;
        location: string;
        phone: string;
        price: number | null;
        condition: FormVals["condition"] | null;
        brand: string | null;
        images: string[];
        status: "pending";
      }> = [];

      for (const [productIndex, product] of productsToSubmit.entries()) {
        const imagePaths: string[] = [];
        const coverIndex = product.photos.findIndex(
          (photo) => photo.id === product.coverPhotoId,
        );
        const orderedPhotos =
          coverIndex > 0
            ? [
                product.photos[coverIndex],
                ...product.photos.filter((_, index) => index !== coverIndex),
              ]
            : product.photos;

        for (const [photoIndex, photo] of orderedPhotos.entries()) {
          setSubmittingStage(
            `Product ${productIndex + 1} of ${productsToSubmit.length}: uploading photo ${photoIndex + 1} of ${orderedPhotos.length}`,
          );
          const extension = photo.file.name.split(".").pop() ?? "jpg";
          const storagePath = `${merchantOwnerId}/${crypto.randomUUID()}.${extension}`;
          const { error: uploadError } = await supabase.storage
            .from("listings")
            .upload(storagePath, photo.file, { upsert: false });
          if (uploadError) throw uploadError;
          uploadedPaths.push(storagePath);
          imagePaths.push(storagePath);
        }

        listingRows.push({
          user_id: merchantOwnerId,
          type: "goods",
          category: product.values.category,
          title: product.values.title,
          description: product.values.description,
          location: product.location,
          phone: product.values.phone,
          price: product.values.price ?? null,
          condition: product.values.condition ?? null,
          brand: product.values.brand ?? null,
          images: imagePaths,
          status: "pending",
        });
      }

      setSubmittingStage(
        `Sending ${productsToSubmit.length} product${productsToSubmit.length === 1 ? "" : "s"} for Admin review`,
      );
      const { data: insertedListings, error: insertError } = await supabase
        .from("listings")
        .insert(listingRows)
        .select("id,title,status");
      if (insertError) throw insertError;
      if (!insertedListings || insertedListings.length !== productsToSubmit.length) {
        throw new Error(
          "Tile could not confirm that every product was submitted. Check your Merchant Hub before retrying.",
        );
      }
      listingsInserted = true;

      window.localStorage.removeItem(DRAFT_KEY);
      setSubmittedListingCount(insertedListings.length);
      setSubmittedListingId(insertedListings.length === 1 ? insertedListings[0].id : null);
      setPromotionState("idle");
      setPromotionStats(null);
      setBatchProducts([]);
      setEditingBatchProductId(null);
      setPhotos([]);
      setCoverPhotoId(null);
      ownedPreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      ownedPreviewUrls.current.clear();
      setSubmitted(true);
      toast.success(
        insertedListings.length === 1
          ? "Product submitted for Admin review."
          : `${insertedListings.length} products submitted for Admin review.`,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-listings", merchantOwnerId] }),
        queryClient.invalidateQueries({ queryKey: ["merchant-shop-listings", merchantOwnerId] }),
        queryClient.invalidateQueries({ queryKey: ["shop-listings", merchantOwnerId] }),
        queryClient.invalidateQueries({ queryKey: ["plan-limits"] }),
      ]);
    } catch (e) {
      console.error("POST PRODUCT BATCH ERROR:", e);
      if (!listingsInserted && uploadedPaths.length) {
        const { error: cleanupError } = await supabase.storage.from("listings").remove(uploadedPaths);
        if (cleanupError) console.error("Could not clean up uploaded batch photos:", cleanupError);
      }
      showError(
        e,
        "We couldn't submit this product batch. Your product details are still available to retry.",
      );
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
      ? `${formatNaira(Number(watch.price) * 0.95)} average price`
      : ""
    : "";

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-clip bg-background">
      <SiteHeader />
      <main className="container mx-auto w-full min-w-0 max-w-6xl px-3 py-4 sm:px-4 sm:py-8">
        <div className="mb-5 flex min-w-0 flex-col gap-4 sm:mb-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="break-words text-2xl font-bold sm:text-3xl">Post on Tile</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base>
              {mode === "home"
                ? "Pick the right path for your business and publish with confidence."
                : "A plan-aware posting flow built for trust, conversion and premium growth."}
            </p>
          </div>
          <div className="w-full min-w-0 rounded-2xl border bg-card p-3 shadow-sm sm:p-4 lg:w-[280px] lg:shrink-0">
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
                <p key={item}>- {item}</p>
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
          <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
            <Card className="p-4 sm:p-6 space-y-6">
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
                    <h3 className="font-bold text-lg"> Sell Something</h3>
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
                    <h3 className="font-bold text-lg">Offer a Service</h3>
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
                    <h3 className="font-bold text-lg"> Open Your Own Shop</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create a branded storefront, share a custom URL and unlock analytics.
                    </p>
                    {!canOpenShop && <p className="text-sm text-accent mt-2">Requires Lite Plan</p>}
                  </div>
                </Button>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-accent font-semibold">
                <ShieldCheck className="h-5 w-5" /> Trust score
              </div>
              <div className="rounded-2xl bg-muted/30 p-4">
                <p className="text-3xl font-bold">{profile?.is_verified ? "96" : "84"}%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Phone verified - Email verified -{" "}
                  {profile?.kyc_status === "verified" ? "KYC verified" : "KYC pending"}
                </p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>- Better trust means better conversion.</p>
                <p>- Premium plans unlock promotions and analytics.</p>
                <p>- Buyers feel safer when listings are polished and verified.</p>
              </div>
            </Card>
          </div>
        ) : submitted ? (
          <Card className="min-w-0 space-y-4 p-4 text-center sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Check className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold">
              {submittedListingCount === 1
                ? "Product submitted successfully."
                : `${submittedListingCount} products submitted successfully.`}
            </h2>
            <p className="text-muted-foreground">
              {submittedListingCount === 1
                ? "Your product is now pending Admin review."
                : "All your products are now pending Admin review."}
              {isPrelaunch
                ? submittedListingCount === 1
                  ? " Because Tile is still in pre-launch, it will remain private even after approval until Admin launches the marketplace."
                  : " Because Tile is still in pre-launch, they will remain private even after approval until Admin launches the marketplace."
                : " Once approved, they can become publicly visible."}
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="outline">
                <Link to="/dashboard" className="w-full sm:w-auto">View dashboard</Link>
              </Button>
              <Button className="bg-accent text-accent-foreground" onClick={returnToChoice}>
                Create another
              </Button>
            </div>
            {submittedListingId && submittedListingCount === 1 && (
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
                    disabled={promoting || promotionState === "promoted" || !canPromote || true}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {promoting
                      ? "Promoting..."
                      : promotionState === "promoted"
                        ? "Promoted"
                        : "Promote after approval"}
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
                    <div className="rounded-xl border bg-background p-3">
                      <p className="font-semibold text-foreground">{promotionStats.views_count}</p>
                      <p>views</p>
                    </div>
                    <div className="rounded-xl border bg-background p-3">
                      <p className="font-semibold text-foreground">{promotionStats.clicks_count}</p>
                      <p>clicks</p>
                    </div>
                    <div className="rounded-xl border bg-background p-3">
                      <p className="font-semibold text-foreground">
                        {promotionStats.favorites_count}
                      </p>
                      <p>saves</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        ) : (
          <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(16rem,0.75fr)]">
            <Card className="min-w-0 p-3 sm:p-5 lg:p-6">
              {search.type === "goods" && (
                <div className="mb-5 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                  <p className="font-semibold text-primary">Add a product to your shop</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose a product category below. Your listing will use the usual review process.
                  </p>
                </div>
              )}
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
                <span>-</span>
                <span>Listing quality {qualityScore}%</span>
              </div>

              {batchProducts.length > 0 && (
                <section className="mb-5 min-w-0 rounded-2xl border bg-card/70 p-3 sm:mb-6 sm:p-4">
                  <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">Your product batch</h3>
                      <p className="text-xs text-muted-foreground">
                        Scroll sideways to review the products you've added.
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                      {batchProducts.length + (editingBatchProductId ? 0 : 1)} product
                      {batchProducts.length + (editingBatchProductId ? 0 : 1) === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div role="list" aria-label="Products in this submission" className="flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3 pr-2 [scrollbar-width:thin] touch-pan-x">
                    {batchProducts.map((product, index) => {
                      const isActive = product.id === editingBatchProductId;
                      return (
                        <div
                          key={product.id}
                          role="listitem"
                          className={`relative flex w-[82%] min-w-[14rem] max-w-[18rem] shrink-0 snap-center items-center rounded-xl border p-2 transition-colors ${isActive ? "border-accent bg-accent/10" : "border-border bg-background"}`}
                        >
                          <button
                            type="button"
                            disabled={submitting || isPreparingPhotos || step !== 4 || isActive}
                            onClick={() =>
                              void form.handleSubmit(
                                (values) => handleSwitchBatchProduct(product, values),
                                onInvalid,
                              )()
                            }
                            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 pr-7 text-left disabled:cursor-default disabled:opacity-100"
                            title={step === 4 ? "Edit this product" : "Finish the current product preview before switching"}
                          >
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                              {product.photos[0] ? (
                                <img src={product.photos[0].previewUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="grid h-full place-items-center text-muted-foreground">
                                  <ImagePlus className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs text-muted-foreground">
                                Product {index + 1} · {product.values.category}
                              </p>
                              <p className="mt-1 truncate text-sm font-semibold">
                                {product.values.title}
                              </p>
                              <p className="mt-1 text-xs text-accent">
                                {isActive ? "Currently editing" : "Ready for review"}
                              </p>
                            </div>
                            {step === 4 && !isActive && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${product.values.title} from batch`}
                            title="Remove product"
                            disabled={submitting || isPreparingPhotos || step !== 4}
                            onClick={() => removeBatchProduct(product.id)}
                            className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                    {!editingBatchProductId && (
                      <div role="listitem"
                        className="flex w-[82%] min-w-[14rem] max-w-[18rem] shrink-0 snap-center items-center gap-3 rounded-xl border border-dashed border-accent/40 bg-accent/[0.04] p-3 sm:w-64">
                        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                          <ImagePlus className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                            Product {batchProducts.length + 1}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold">
                            {watch.title || "New product in progress"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">Currently being added</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground sm:hidden">Swipe sideways to browse your product cards.</p>
                  {step !== 4 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Complete this product and open Preview to switch back and edit another one.
                    </p>
                  )}
                </section>
              )}

              <div className="mb-5 grid grid-cols-2 gap-2 sm:mb-6 sm:grid-cols-4">
                {["Category", "Details", "Photos", "Preview"].map((label, index) => {
                  const active = index + 1 === step;
                  return (
                    <div
                      key={label}
                      className={`flex min-w-0 items-center justify-center rounded-xl border px-2 py-2 text-center text-xs sm:rounded-full sm:px-3 sm:py-1 sm:text-sm ${active ? "border-accent bg-accent/10 text-foreground" : "text-muted-foreground"}`}
                    >
                      {index + 1} {label}
                    </div>
                  );
                })}
              </div>

              <form
                ref={formRef}
                onSubmit={form.handleSubmit(onSubmit, onInvalid)}
                className="min-w-0 space-y-5"
                noValidate
              >
                {step === 1 && (
                  <>
                    <h2 className="text-lg font-semibold sm:text-xl">
                      Pick a category <span className="text-destructive">*</span>
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Cards feel more premium and make it easier to browse your listing.
                    </p>
                    <div data-field="category" className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                      {CATEGORIES.filter((c) => c.type === "goods").map((c) => {
                        const isSelected = watch.category === c.slug;
                        const meta = CATEGORY_META[c.slug] ?? {
                          icon: "",
                          subtitle: "Popular listing",
                        };
                        return (
                          <button
                            key={c.slug}
                            type="button"
                            onClick={() =>
                              form.setValue("category", c.slug, { shouldValidate: true })
                            }
                            className={`w-full min-w-0 rounded-2xl border p-3 text-left transition-all sm:p-4 ${isSelected ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-muted/50"}`}
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
                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-between">
                      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={returnToChoice}>
                        Cancel
                      </Button>
                      <Button type="button" className="w-full sm:w-auto" onClick={handleCategoryNext}>
                        Next <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2 className="text-lg font-semibold sm:text-xl">Add details that convert</h2>
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
                          <Label>Price (NGN)</Label>
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
                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-between">
                      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={prevStep}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button type="button" className="w-full sm:w-auto" onClick={handleDetailsNext}>
                        Next <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h2 className="text-lg font-semibold sm:text-xl">Photos and location</h2>
                    <div className="min-w-0 space-y-4 rounded-2xl border bg-muted/20 p-3 sm:space-y-5 sm:p-5">
                      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
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
                          className="w-full sm:w-auto"
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
                        className={`rounded-2xl border-2 border-dashed p-4 text-center transition-all sm:p-6 ${dragActive ? "border-accent bg-accent/10" : "border-border"} ${isPreparingPhotos || submitting ? "opacity-70" : ""}`}
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
                                ? "Optimizing your photos..."
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
                        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
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
                              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p
                                  className="w-full min-w-0 truncate text-xs font-medium text-muted-foreground sm:w-auto sm:flex-1"
                                  title={photo.file.name}
                                >
                                  {photo.file.name}
                                </p>
                                <div className="flex w-full flex-wrap items-center gap-1 sm:w-auto sm:shrink-0">
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

                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-between">
                      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={prevStep}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button type="button" className="w-full sm:w-auto" onClick={handlePreviewNext}>
                        Preview <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-lg font-semibold sm:text-xl">Preview your product</h2>
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                        {editingBatchProductId
                          ? `Editing product ${batchProducts.findIndex((product) => product.id === editingBatchProductId) + 1} of ${batchProducts.length}`
                          : `Product ${batchProducts.length + 1} of ${batchProducts.length + 1}`}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Review the listing exactly as buyers will see it before publishing.
                    </p>
                    <div className="min-w-0 space-y-4 rounded-2xl border bg-muted/20 p-3 sm:p-5">
                      <div className="rounded-2xl bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                          Preview
                        </p>
                        <h3 className="mt-2 break-words text-lg font-semibold sm:text-xl">
                          {watch.title || "Your title goes here"}
                        </h3>
                        <p className="mt-2 break-words text-sm text-muted-foreground">
                          {watch.description ||
                            "Add a clear description with condition, specs and pricing."}
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            {watch.price
                              ? `NGN ${Number(watch.price).toLocaleString()}`
                              : "Price not set"}
                          </span>
                          <span>-</span>
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
                    <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={prevStep}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full whitespace-normal sm:w-auto"
                          disabled={submitting || postingDisabled || isPreparingPhotos}
                          onClick={form.handleSubmit(handleAddAnotherProduct, onInvalid)}
                        >
                          <ImagePlus className="mr-2 h-4 w-4" />
                          Add another product
                        </Button>
                        <Button
                          type="submit"
                          disabled={submitting || postingDisabled || isPreparingPhotos}
                          className="w-full whitespace-normal text-center leading-snug sm:w-auto bg-accent text-accent-foreground"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          {submitting
                            ? submittingStage
                            : `Submit ${batchProducts.length + (editingBatchProductId ? 0 : 1)} product${batchProducts.length + (editingBatchProductId ? 0 : 1) === 1 ? "" : "s"} for Admin Review`}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </form>
            </Card>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-1">
              <Card className="min-w-0 p-4 sm:p-5">
                <h3 className="font-semibold">Manage your business</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your active plan features and Top Ad allowance are shown in your Merchant Hub.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-3">
                  <Link to="/dashboard">Open Merchant Hub</Link>
                </Button>
              </Card>
              <Card className="min-w-0 p-4 sm:p-5">
                <h3 className="font-semibold">Trust signals</h3>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p>- Phone verified</p>
                  <p>- Email verified</p>
                  <p>- {profile?.kyc_status === "verified" ? "KYC verified" : "KYC pending"}</p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
