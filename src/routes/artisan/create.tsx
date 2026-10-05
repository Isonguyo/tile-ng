import { rpcUntyped } from "@/lib/waitlist-rpc";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { fromUntyped } from "@/lib/db-untyped";
import { ARTISAN_CATEGORIES } from "@/lib/artisan-categories";
import { toast } from "sonner";
import { showError } from "@/lib/user-feedback";

import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  CheckCircle2,
  Briefcase,
  Layers,
  UserRound,
  Images,
  BadgeDollarSign,
  House,
  CalendarDays,
  Zap,
  Star,
  MapPin,
} from "lucide-react";

export const Route = createFileRoute("/artisan/create")({
  component: ArtisanCreatePage,
});

const schema = z.object({
  full_name: z.string().min(2, "Enter your full name"),
  profession: z.string().min(1, "Select your profession"),
  bio: z
    .string()
    .min(30, "Tell customers about yourself (minimum 30 characters)")
    .max(500, "Bio is too long"),
  phone: z.string().min(10, "Enter a valid phone number"),
  whatsapp: z.string().optional(),
  state: z.string().min(1, "Select a state"),
  lga: z.string().min(1, "Select an LGA"),
  years_experience: z.coerce.number().min(0).max(80),
  is_available: z.boolean(),
  starting_price: z.coerce.number().optional(),
  offers_home_service: z.boolean(),
  offers_emergency_service: z.boolean(),
  available_weekends: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function ArtisanCreatePage() {
  const { user, loading, profile } = useAuth();
  const navigate = useNavigate();

  const { data: platformSettings } = useQuery({
    queryKey: ["artisan-create-platform-settings"],
    queryFn: async () => {
      const { data, error } = await rpcUntyped("get_public_platform_flags");

      if (error) throw new Error(error.message);
      return data as { launch_mode?: "prelaunch" | "launched"; disable_posting?: boolean } | null;
    },
    staleTime: 30_000,
  });

  const isPrelaunch = platformSettings?.launch_mode !== "launched";
  const postingDisabled = platformSettings?.disable_posting === true;

  const { data: existingArtisan } = useQuery({
    queryKey: ["existing-artisan", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_profile");

      if (error) throw error;

      type MyProfile = {
        full_name: string | null;
        profession: string | null;
        bio: string | null;
        phone: string | null;
        whatsapp: string | null;
        state: string | null;
        lga: string | null;
        years_experience: number | null;
        is_available: boolean | null;
        starting_price: number | null;
        offers_home_service: boolean | null;
        offers_emergency_service: boolean | null;
        available_weekends: boolean | null;
        is_artisan: boolean | null;
        profile_photo: string | null;
        avatar_url: string | null;
        portfolio_images: string[] | null;
      };
      return ((data as unknown as MyProfile[])?.[0] ?? null) as MyProfile | null;
    },
  });

  const [step, setStep] = useState(1);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [portfolioImages, setPortfolioImages] = useState<File[]>([]);
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profilePhoto) {
      setProfilePhotoPreview(existingArtisan?.profile_photo || existingArtisan?.avatar_url || "");
      return;
    }
    const previewUrl = URL.createObjectURL(profilePhoto);
    setProfilePhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [profilePhoto, existingArtisan?.profile_photo, existingArtisan?.avatar_url]);

  useEffect(() => {
    const previewUrls = portfolioImages.map((file) => URL.createObjectURL(file));
    setPortfolioPreviews(previewUrls);
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [portfolioImages]);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: existingArtisan
      ? {
          full_name: existingArtisan.full_name ?? "",
          profession: existingArtisan.profession ?? "",
          bio: existingArtisan.bio ?? "",
          phone: existingArtisan.phone ?? "",
          whatsapp: existingArtisan.whatsapp ?? "",
          state: existingArtisan.state ?? "",
          lga: existingArtisan.lga ?? "",
          years_experience: existingArtisan.years_experience ?? 0,
          is_available: existingArtisan.is_available ?? true,
          starting_price: existingArtisan.starting_price ?? undefined,
          offers_home_service: existingArtisan.offers_home_service ?? true,
          offers_emergency_service: existingArtisan.offers_emergency_service ?? false,
          available_weekends: existingArtisan.available_weekends ?? false,
        }
      : {
          full_name: "",
          profession: "",
          bio: "",
          phone: "",
          whatsapp: "",
          state: "",
          lga: "",
          years_experience: 0,
          is_available: true,
          starting_price: undefined,
          offers_home_service: true,
          offers_emergency_service: false,
          available_weekends: false,
        },
  });
  useEffect(() => {
    if (!profile?.is_artisan) return;

    form.reset({
      full_name: profile.full_name ?? "",
      profession: profile.profession ?? "",
      bio: profile.bio ?? "",
      phone: profile.phone ?? "",
      whatsapp: profile.whatsapp ?? "",
      state: profile.state ?? "",
      lga: profile.lga ?? "",
      years_experience: profile.years_experience ?? 0,
      starting_price: profile.starting_price ?? undefined,
      is_available: profile.is_available ?? true,
      offers_home_service: profile.offers_home_service ?? true,
      offers_emergency_service: profile.offers_emergency_service ?? false,
      available_weekends: profile.available_weekends ?? false,
    });
  }, [profile, form]);
  const watch = form.watch();

  const { data: states = [] } = useQuery({
    queryKey: ["artisan-states"],
    queryFn: async () => {
      const { data, error } = await supabase.from("states").select("id, name").order("name");

      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: lgas = [] } = useQuery({
    queryKey: ["artisan-lgas", watch.state],
    enabled: !!watch.state,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lgas")
        .select("id, name")
        .eq("state_id", watch.state)
        .order("name");

      if (error) throw error;
      return data ?? [];
    },
  });

  const handleValidateBasicInfo = async () => {
    const isStep2Valid = await form.trigger([
      "full_name",
      "profession",
      "bio",
      "phone",
      "state",
      "lga",
      "years_experience",
    ]);

    if (isStep2Valid) {
      setStep(3);
    } else {
      const fields = [
        "full_name",
        "profession",
        "phone",
        "state",
        "lga",
        "years_experience",
        "bio",
      ] as const;
      const firstInvalid = fields.find((field) => form.getFieldState(field).error);
      const message = firstInvalid ? form.getFieldState(firstInvalid).error?.message : undefined;
      toast.error(message ?? "Please complete all required fields correctly.");
      if (firstInvalid) focusFormField(formRef.current, firstInvalid);
    }
  };

  const handleAdvanceToReview = () => {
    const missingProfilePhoto =
      !profilePhoto && !existingArtisan?.profile_photo && !existingArtisan?.avatar_url;
    const existingPortfolioCount = existingArtisan?.portfolio_images?.length ?? 0;
    const missingPortfolioCount = Math.max(0, 3 - portfolioImages.length - existingPortfolioCount);

    if (missingProfilePhoto || missingPortfolioCount > 0) {
      const profileError = missingProfilePhoto
        ? "Add a clear profile photo before continuing."
        : undefined;
      const portfolioError =
        missingPortfolioCount > 0
          ? `Add at least ${missingPortfolioCount} more portfolio photo${missingPortfolioCount === 1 ? "" : "s"} to continue.`
          : undefined;
      setPhotoErrors({ profile: profileError, portfolio: portfolioError });
      toast.error(
        missingProfilePhoto && missingPortfolioCount > 0
          ? `Add a profile photo and ${missingPortfolioCount} portfolio photo${missingPortfolioCount === 1 ? "" : "s"} to continue.`
          : (profileError ?? portfolioError ?? "Complete the required photo fields to continue."),
      );
      focusFormField(formRef.current, missingProfilePhoto ? "profile_photo" : "portfolio_images");
      return;
    }
    setPhotoErrors({});
    goToStep(4);
  };

  const onInvalid = (invalid: FieldErrors<FormValues>) => {
    const first = Object.keys(invalid)[0] as keyof FormValues | undefined;
    if (!first) return;
    const message = invalid[first]?.message;
    toast.error(
      typeof message === "string"
        ? message
        : "Please complete the required artisan profile fields.",
    );
    if (step !== 2) {
      setStep(2);
      focusFormFieldAfterRender(formRef.current, first);
      return;
    }
    focusFormField(formRef.current, first);
  };

  const selectedStateName =
    states.find((s: { id: string; name: string }) => s.id === watch.state)?.name || "";
  const selectedLgaName =
    lgas.find((l: { id: string; name: string }) => l.id === watch.lga)?.name || "";

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setSubmitting(true);

    try {
      let avatarUrl = "";
      const portfolioUrls: string[] = [...(existingArtisan?.portfolio_images ?? [])];

      if (profilePhoto) {
        const fileExt = profilePhoto.name.split(".").pop();

        // ❌ OLD: `artisans/${user.id}/avatar-${Date.now()}.${fileExt}`
        // ✅ NEW: Start directly with user.id
        const filePath = `${user.id}/artisan-avatar-${Date.now()}.${fileExt}`;

        const { error: avatarErr } = await supabase.storage
          .from("listings")
          .upload(filePath, profilePhoto, { cacheControl: "3600", upsert: true });

        if (avatarErr) throw avatarErr;

        const {
          data: { publicUrl },
        } = supabase.storage.from("listings").getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      if (portfolioImages.length > 0) {
        for (const file of portfolioImages) {
          const fileExt = file.name.split(".").pop();

          // ❌ OLD: `artisans/${user.id}/portfolio-${crypto.randomUUID()}.${fileExt}`
          // ✅ NEW: Start directly with user.id
          const filePath = `${user.id}/artisan-portfolio-${crypto.randomUUID()}.${fileExt}`;

          const { error: portErr } = await supabase.storage.from("listings").upload(filePath, file);

          if (portErr) throw portErr;

          const {
            data: { publicUrl },
          } = supabase.storage.from("listings").getPublicUrl(filePath);

          portfolioUrls.push(publicUrl);
        }
      }

      const { error } = await fromUntyped("profiles")
        .update({
          full_name: values.full_name,
          profession: values.profession,
          bio: values.bio,
          phone: values.phone,
          whatsapp: values.whatsapp || null,
          state: selectedStateName,
          lga: selectedLgaName,
          years_experience: values.years_experience,
          is_available: values.is_available,
          is_artisan: true,
          is_prelaunch: isPrelaunch,
          artisan_status: "pending",
          starting_price: values.starting_price || null,
          offers_home_service: values.offers_home_service,
          offers_emergency_service: values.offers_emergency_service,
          available_weekends: values.available_weekends,
          avatar_url: avatarUrl || existingArtisan?.avatar_url || existingArtisan?.profile_photo,

          profile_photo: avatarUrl || existingArtisan?.profile_photo || existingArtisan?.avatar_url,

          portfolio_images:
            portfolioUrls.length > 0
              ? portfolioUrls
              : (existingArtisan?.portfolio_images ?? undefined),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(
        isPrelaunch
          ? "Your artisan profile has been submitted for review and will remain private until approved and the marketplace launches."
          : "Your artisan profile has been submitted for review and will remain private until it is approved.",
      );
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      console.error(err);
      showError(
        err,
        "We couldn't save your artisan profile. Please check your details and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-[#06120d] text-slate-100">
        <SiteHeader />
        <div className="container mx-auto max-w-xl px-4 py-24 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.08]">
            <Briefcase className="h-8 w-8 text-emerald-300" />
          </div>
          <h1 className="text-3xl font-bold text-white">Become a Tile Artisan</h1>
          <p className="mt-4 text-slate-400">
            Create your professional profile so customers can discover and contact you anywhere in
            Nigeria.
          </p>
          <Button asChild className="mt-8">
            <Link to="/auth">Sign in to continue</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06120d] text-slate-100">
      <SiteHeader />
      <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {isPrelaunch && (
          <div className="mb-5 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.05] p-4 sm:p-5">
            <p className="font-semibold text-emerald-200">Tile is currently in pre-launch.</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              You can complete your artisan profile now. It will stay private until it is approved
              and the marketplace launches.
            </p>
          </div>
        )}

        {postingDisabled && (
          <div className="mb-5 rounded-2xl border border-rose-300/15 bg-rose-400/[0.05] p-4 sm:p-5">
            <p className="font-semibold text-rose-200">
              New marketplace submissions are temporarily disabled.
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Submitting new artisan profile changes is currently paused.
            </p>
          </div>
        )}

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            Artisan onboarding
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Create your artisan profile
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Join the professional network of verified service providers and installers across
            Nigeria.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-[#1b3b2a] bg-gradient-to-r from-[#10241a] to-[#0b1a13] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-white">Your profile setup</span>
            <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-1 text-xs font-semibold text-emerald-200">
              Step {step} of 4
            </span>
          </div>
          <Progress value={step * 25} className="h-2 bg-white/[0.08]" />
          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px] font-semibold sm:text-xs">
            {["Start", "Details", "Portfolio", "Review"].map((label, index) => (
              <span
                key={label}
                className={index + 1 <= step ? "text-emerald-200" : "text-slate-500"}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden rounded-3xl border border-[#1b3b2a] bg-gradient-to-b from-[#102017] to-[#09150f] text-slate-100 shadow-[0_24px_65px_rgba(0,0,0,0.28)]">
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            {/* STEP 1: Onboarding Introduction */}
            {step === 1 && (
              <div className="p-5 sm:p-8">
                <div className="text-center">
                  <div className="flex justify-center mb-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.08]">
                      <UserRound className="h-8 w-8 text-emerald-300" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Build your professional presence
                  </h2>
                  <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400 sm:text-base">
                    Create your professional profile so customers across Nigeria can discover your
                    skills, view your previous work and contact you directly.
                  </p>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                    <span>Appear in local artisan search results</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                    <span>Build trust with a complete professional profile</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                    <span>Showcase photos of your previous projects</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                    <span>Receive enquiries directly from customers</span>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] p-5">
                  <h3 className="mb-4 font-semibold text-white">How it works</h3>
                  <div className="space-y-3 text-sm text-slate-400">
                    <p>1️⃣ Create your artisan profile</p>
                    <p>2️⃣ Upload your portfolio</p>
                    <p>3️⃣ Customers contact you directly</p>
                  </div>
                </div>

                <Button
                  className="mt-7 h-12 w-full rounded-xl bg-[#35d879] font-bold text-[#04120a] hover:bg-[#52e98f]"
                  size="lg"
                  type="button"
                  onClick={() => goToStep(2)}
                  disabled={postingDisabled}
                >
                  Create My Profile
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}

            {/* STEP 2: Basic Identity Configuration */}
            {step === 2 && (
              <div className="space-y-6 p-5 sm:p-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">Basic information</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Tell customers who you are and what you do.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artisan-full-name">
                    Full Name <span className="text-rose-300">*</span>
                  </Label>
                  <Input
                    id="artisan-full-name"
                    placeholder="John Doe"
                    className="h-11 rounded-xl border-white/10 bg-[#08150f] text-white placeholder:text-slate-600"
                    {...form.register("full_name")}
                  />
                  {form.formState.errors.full_name && (
                    <p className="text-xs text-rose-300">
                      {form.formState.errors.full_name.message}
                    </p>
                  )}
                </div>

                <div data-field="profession" className="space-y-2">
                  <Label>
                    Profession <span className="text-rose-300">*</span>
                  </Label>
                  <Select
                    value={watch.profession}
                    onValueChange={(value) =>
                      form.setValue("profession", value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-white/10 bg-[#08150f] text-slate-100">
                      <SelectValue placeholder="Select your profession" />
                    </SelectTrigger>
                    <SelectContent>
                      {ARTISAN_CATEGORIES.map((category) => (
                        <SelectItem key={category.id} value={category.label}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {form.formState.errors.profession && (
                  <p className="-mt-4 text-xs text-rose-300">
                    {form.formState.errors.profession.message}
                  </p>
                )}

                <div data-field="phone" className="space-y-2">
                  <Label>
                    Phone Number <span className="text-rose-300">*</span>
                  </Label>
                  <Input
                    type="tel"
                    placeholder="08012345678"
                    className="h-11 rounded-xl border-white/10 bg-[#08150f] text-white placeholder:text-slate-600"
                    {...form.register("phone")}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-rose-300">{form.formState.errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>WhatsApp Number (Optional)</Label>
                  <Input
                    type="tel"
                    placeholder="08012345678"
                    className="h-11 rounded-xl border-white/10 bg-[#08150f] text-white placeholder:text-slate-600"
                    {...form.register("whatsapp")}
                  />
                </div>

                <div data-field="state" className="space-y-2">
                  <Label>
                    State <span className="text-rose-300">*</span>
                  </Label>
                  <Select
                    value={watch.state}
                    onValueChange={(value) => {
                      form.setValue("state", value, { shouldValidate: true, shouldDirty: true });
                      form.setValue("lga", "");
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-white/10 bg-[#08150f] text-slate-100">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state: { id: string; name: string }) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.state && (
                    <p className="text-xs text-rose-300">{form.formState.errors.state.message}</p>
                  )}
                </div>

                <div data-field="lga" className="space-y-2">
                  <Label>
                    Local Government Area <span className="text-rose-300">*</span>
                  </Label>
                  <Select
                    disabled={!watch.state}
                    value={watch.lga}
                    onValueChange={(value) =>
                      form.setValue("lga", value, { shouldValidate: true, shouldDirty: true })
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-white/10 bg-[#08150f] text-slate-100">
                      <SelectValue placeholder="Select Local Government" />
                    </SelectTrigger>
                    <SelectContent>
                      {lgas.map((lga: { id: string; name: string }) => (
                        <SelectItem key={lga.id} value={lga.id}>
                          {lga.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.lga && (
                    <p className="text-xs text-rose-300">{form.formState.errors.lga.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    min="0"
                    max="80"
                    placeholder="5"
                    className="h-11 rounded-xl border-white/10 bg-[#08150f] text-white placeholder:text-slate-600"
                    {...form.register("years_experience")}
                  />
                  {form.formState.errors.years_experience && (
                    <p className="text-xs text-rose-300">
                      {form.formState.errors.years_experience.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>
                      Professional Bio <span className="text-rose-300">*</span>
                    </Label>
                    <span
                      className={`text-xs ${
                        (watch.bio?.length ?? 0) >= 30
                          ? "font-medium text-emerald-300"
                          : "text-slate-500"
                      }`}
                    >
                      {watch.bio?.length ?? 0}/500 characters
                    </span>
                  </div>
                  <Textarea
                    rows={5}
                    maxLength={500}
                    placeholder="Tell customers about your experience, skills, projects and why they should hire you..."
                    className="rounded-xl border-white/10 bg-[#08150f] text-white placeholder:text-slate-600"
                    {...form.register("bio")}
                  />
                  {form.formState.errors.bio ? (
                    <p className="text-xs text-rose-300">{form.formState.errors.bio.message}</p>
                  ) : (
                    <p
                      className={`text-xs ${(watch.bio?.length ?? 0) >= 30 ? "text-emerald-300" : "font-medium text-amber-200"}`}
                    >
                      Minimum 30 characters required. Tell customers what makes you stand out.
                    </p>
                  )}
                </div>

                <div className="flex justify-between border-t border-white/[0.07] pt-4">
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/15 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]"
                    onClick={() => goToStep(1)}
                    type="button"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="rounded-xl bg-[#35d879] font-bold text-[#04120a] hover:bg-[#52e98f]"
                    onClick={handleValidateBasicInfo}
                  >
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Portfolio & Scope Settings */}
            {step === 3 && (
              <div className="space-y-8 p-5 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.08]">
                    <Images className="h-6 w-6 text-emerald-300" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                      Portfolio and availability
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      This is what customers will look at before they initiate contact with you.
                    </p>
                  </div>
                </div>

                {/* Profile Photo Section */}
                <Card
                  data-field="profile_photo"
                  className="flex flex-col items-center rounded-2xl border border-dashed border-emerald-300/20 bg-white/[0.02] p-5 sm:p-6"
                >
                  <Camera className="mb-3 h-8 w-8 text-emerald-300" />
                  <h3 className="flex items-center gap-2 text-center text-sm font-semibold text-white">
                    <UserRound className="h-4 w-4" /> Profile Photo
                  </h3>
                  <p className="mt-1 max-w-xs text-center text-xs leading-5 text-slate-400">
                    Upload a clear, welcoming, and professional photo of yourself.
                  </p>

                  <div className="mt-4 flex flex-col items-center gap-3 w-full max-w-xs">
                    {profilePhotoPreview && (
                      <div className="h-20 w-20 overflow-hidden rounded-2xl border border-emerald-300/25 shadow-lg">
                        <img
                          src={profilePhotoPreview}
                          alt="Profile photo preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      ref={avatarInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setProfilePhoto(e.target.files[0]);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      className="h-11 w-full max-w-xs rounded-xl border-white/15 bg-white/[0.03] text-slate-100 hover:border-emerald-300/30 hover:bg-emerald-300/[0.06]"
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      {profilePhotoPreview ? "Change Photo" : "Choose Photo"}
                    </Button>
                    {photoErrors.profile && (
                      <p className="text-center text-xs font-medium text-rose-300">
                        {photoErrors.profile}
                      </p>
                    )}
                  </div>
                </Card>

                {/* Previous Jobs Portfolio Section */}
                <Card
                  data-field="portfolio_images"
                  className="rounded-2xl border border-dashed border-emerald-300/20 bg-white/[0.02] p-5 sm:p-6"
                >
                  <div className="text-center max-w-md mx-auto mb-4">
                    <h3 className="flex items-center justify-center gap-2 text-sm font-semibold text-white">
                      <Images className="h-4 w-4" /> Previous Jobs
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Upload between 3 and 8 clear photos of real setup jobs or projects you have
                      personally completed.
                    </p>
                    <p className="mt-2 text-xs font-semibold text-emerald-300">
                      {portfolioImages.length + (existingArtisan?.portfolio_images?.length ?? 0)}/8
                      uploaded
                    </p>
                    {photoErrors.portfolio && (
                      <p className="mt-2 text-xs font-medium text-rose-300">
                        {photoErrors.portfolio}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-center">
                    <input
                      type="file"
                      ref={portfolioInputRef}
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (!e.target.files) return;
                        const uploaded = Array.from(e.target.files);
                        const existingCount = existingArtisan?.portfolio_images?.length ?? 0;
                        const next = [...portfolioImages, ...uploaded].slice(
                          0,
                          Math.max(0, 8 - existingCount),
                        );
                        setPortfolioImages(next);
                        setPhotoErrors((current) => ({
                          ...current,
                          portfolio:
                            next.length + existingCount >= 3
                              ? undefined
                              : current.portfolio
                                ? `Add at least ${3 - next.length - existingCount} more portfolio photo${3 - next.length - existingCount === 1 ? "" : "s"} to continue.`
                                : undefined,
                        }));
                        e.target.value = "";
                      }}
                    />
                    <Button
                      variant="outline"
                      className="h-11 w-full max-w-xs rounded-xl border-white/15 bg-white/[0.03] text-slate-100 hover:border-emerald-300/30 hover:bg-emerald-300/[0.06]"
                      type="button"
                      onClick={() => portfolioInputRef.current?.click()}
                      disabled={
                        (existingArtisan?.portfolio_images?.length ?? 0) + portfolioImages.length >=
                        8
                      }
                    >
                      Add Portfolio Photos
                    </Button>
                  </div>

                  {((existingArtisan?.portfolio_images?.length ?? 0) > 0 ||
                    portfolioImages.length > 0) && (
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {existingArtisan?.portfolio_images?.map((url, idx) => (
                        <div
                          key={url}
                          className="relative aspect-square overflow-hidden rounded-xl border border-emerald-300/15 bg-[#07150e]"
                        >
                          <img
                            src={url}
                            alt={`Existing portfolio project ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute bottom-0 w-full bg-black/65 py-1 text-center text-[10px] font-semibold text-white">
                            Current work
                          </span>
                        </div>
                      ))}
                      {portfolioImages.map((file, idx) => (
                        <div
                          key={idx}
                          className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-[#07150e]"
                        >
                          <img
                            src={portfolioPreviews[idx]}
                            alt={`New portfolio project ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setPortfolioImages((p) => p.filter((_, i) => i !== idx))}
                            aria-label={`Remove portfolio photo ${idx + 1}`}
                            className="absolute right-2 top-2 rounded-full border border-white/15 bg-black/75 p-2 text-white opacity-100 transition-colors hover:bg-rose-500 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Starting Price Field */}
                <div className="max-w-sm space-y-2">
                  <Label
                    htmlFor="starting_price"
                    className="flex items-center gap-2 text-sm font-semibold text-slate-200"
                  >
                    <BadgeDollarSign className="h-5 w-5 text-emerald-300" /> Starting Price
                    (Optional)
                  </Label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-muted-foreground text-sm">₦</span>
                    </div>
                    <Input
                      id="starting_price"
                      type="number"
                      className="h-11 rounded-xl border-white/10 bg-[#08150f] pl-7 text-white placeholder:text-slate-600"
                      placeholder="e.g. 15,000"
                      {...form.register("starting_price")}
                    />
                  </div>
                  <p className="text-[11px] leading-5 text-slate-500">
                    Example: Starting from ₦15,000 per square meter or project base rate.
                  </p>
                </div>

                {/* Dynamic Network Availability Grid */}
                <div className="space-y-4 pt-2">
                  <Label className="block border-b border-white/[0.07] pb-2 text-sm font-semibold text-white">
                    Service Terms & Availability Settings
                  </Label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Available for Work */}
                    <div className="flex items-start space-x-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5 transition-colors hover:border-emerald-300/20">
                      <Controller
                        name="is_available"
                        control={form.control}
                        render={({ field }) => (
                          <Checkbox
                            id="is_available"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor="is_available"
                          className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
                        >
                          <UserRound className="h-3.5 w-3.5 text-emerald-300" /> Available for work
                        </Label>
                        <p className="text-xs leading-5 text-slate-400">
                          Instantly show up in customer matching queues.
                        </p>
                      </div>
                    </div>

                    {/* Home Service */}
                    <div className="flex items-start space-x-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5 transition-colors hover:border-emerald-300/20">
                      <Controller
                        name="offers_home_service"
                        control={form.control}
                        render={({ field }) => (
                          <Checkbox
                            id="offers_home_service"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor="offers_home_service"
                          className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
                        >
                          <House className="h-3.5 w-3.5 text-emerald-300" /> Home service
                        </Label>
                        <p className="text-xs leading-5 text-slate-400">
                          Open to traveling directly to client construction locations.
                        </p>
                      </div>
                    </div>

                    {/* Emergency Support */}
                    <div className="flex items-start space-x-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5 transition-colors hover:border-emerald-300/20">
                      <Controller
                        name="offers_emergency_service"
                        control={form.control}
                        render={({ field }) => (
                          <Checkbox
                            id="offers_emergency_service"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor="offers_emergency_service"
                          className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
                        >
                          <Zap className="h-3.5 w-3.5 text-amber-200" /> Emergency service
                        </Label>
                        <p className="text-xs leading-5 text-slate-400">
                          Available for urgent repairs callouts outside standard hours.
                        </p>
                      </div>
                    </div>

                    {/* Weekends */}
                    <div className="flex items-start space-x-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5 transition-colors hover:border-emerald-300/20">
                      <Controller
                        name="available_weekends"
                        control={form.control}
                        render={({ field }) => (
                          <Checkbox
                            id="available_weekends"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor="available_weekends"
                          className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
                        >
                          <CalendarDays className="h-3.5 w-3.5 text-emerald-300" /> Weekend
                          Availability
                        </Label>
                        <p className="text-xs leading-5 text-slate-400">
                          Accept appointments over Saturdays and Sundays.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between border-t border-white/[0.07] pt-4">
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/15 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]"
                    onClick={() => goToStep(2)}
                    type="button"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="rounded-xl bg-[#35d879] font-bold text-[#04120a] hover:bg-[#52e98f]"
                    onClick={handleAdvanceToReview}
                  >
                    Continue to Review
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: Premium Live Profile Card Review Layout */}
            {step === 4 && (
              <div className="space-y-6 p-5 sm:p-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">Preview your profile</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {isPrelaunch
                      ? "Review the information you are submitting to Admin. Your profile will remain private until it is approved and the marketplace launches."
                      : "Review the information you are submitting. Your profile will remain private until it is approved."}
                  </p>
                </div>

                <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-emerald-300/15 bg-[#0b1912] shadow-[0_22px_55px_rgba(0,0,0,0.32)]">
                  <div className="relative flex flex-col items-center border-b border-white/[0.07] bg-[radial-gradient(ellipse_at_50%_0%,rgba(52,211,153,0.12),transparent_65%)] p-6 text-center">
                    {watch.is_available && (
                      <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-emerald-300/15 bg-emerald-300/[0.08] px-2.5 py-1 text-xs font-semibold text-emerald-100">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300"></span>
                        Available Today
                      </span>
                    )}

                    <div className="mb-3 h-24 w-24 overflow-hidden rounded-2xl border-4 border-[#0b1912] bg-white/[0.05] shadow-lg">
                      {profilePhotoPreview ? (
                        <img
                          src={profilePhotoPreview}
                          alt="Avatar preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white/[0.04]">
                          <UserRound className="h-8 w-8 text-slate-500" />
                        </div>
                      )}
                    </div>

                    <h3 className="flex items-center gap-1.5 text-xl font-bold text-white">
                      {watch.full_name || "John Doe"}
                    </h3>
                    <p className="mt-0.5 text-sm font-medium text-emerald-300">
                      {watch.profession || "Verified Installer"}
                    </p>

                    <div className="flex items-center gap-0.5 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < 4 ? "text-amber-500 fill-amber-500" : "text-muted border-muted"}`}
                        />
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-4 text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Briefcase className="h-3.5 w-3.5" /> {watch.years_experience || 0} years
                        experience
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <MapPin className="h-3.5 w-3.5" /> {selectedStateName || "Lagos"} •{" "}
                        {selectedLgaName || "Ikeja"}
                      </span>
                    </div>

                    {watch.starting_price && (
                      <div className="mt-4 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-4 py-1.5 text-xs font-bold text-emerald-100">
                        Starting From ₦{Number(watch.starting_price).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 p-5 text-sm">
                    <div>
                      <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                        About
                      </h4>
                      <p className="leading-relaxed text-slate-300 italic">
                        "{watch.bio || "No profile bio written yet..."}"
                      </p>
                    </div>

                    <div>
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Portfolio showcase
                      </h4>
                      <div className="grid grid-cols-4 gap-2">
                        {(existingArtisan?.portfolio_images ?? []).map((url, idx) => (
                          <div
                            key={url}
                            className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
                          >
                            <img
                              src={url}
                              alt={`Portfolio project ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                        {portfolioImages.map((file, idx) => (
                          <div
                            key={`${file.name}-${idx}`}
                            className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
                          >
                            <img
                              src={portfolioPreviews[idx]}
                              alt={`New portfolio project ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-3 text-center text-[10px] font-semibold text-slate-500 sm:text-[11px]">
                      <div
                        className={`rounded-lg border p-2 ${watch.offers_home_service ? "border-emerald-300/15 bg-emerald-300/[0.06] text-emerald-100" : "opacity-40"}`}
                      >
                        Home Service {watch.offers_home_service ? "✓" : "✗"}
                      </div>
                      <div
                        className={`rounded-lg border p-2 ${watch.offers_emergency_service ? "border-emerald-300/15 bg-emerald-300/[0.06] text-emerald-100" : "opacity-40"}`}
                      >
                        Emergency {watch.offers_emergency_service ? "✓" : "✗"}
                      </div>
                      <div
                        className={`rounded-lg border p-2 ${watch.available_weekends ? "border-emerald-300/15 bg-emerald-300/[0.06] text-emerald-100" : "opacity-40"}`}
                      >
                        Weekends {watch.available_weekends ? "✓" : "✗"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between border-t border-white/[0.07] pt-4">
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/15 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]"
                    onClick={() => goToStep(3)}
                    type="button"
                    disabled={submitting}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl bg-[#35d879] font-bold text-[#04120a] hover:bg-[#52e98f]"
                    disabled={submitting || postingDisabled}
                  >
                    {submitting ? "Submitting Profile..." : "Submit Profile for Admin Review"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
