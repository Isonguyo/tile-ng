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
        full_name: string | null; profession: string | null; bio: string | null;
        phone: string | null; whatsapp: string | null; state: string | null; lga: string | null;
        years_experience: number | null; is_available: boolean | null; starting_price: number | null;
        offers_home_service: boolean | null; offers_emergency_service: boolean | null;
        available_weekends: boolean | null; is_artisan: boolean | null;
        profile_photo: string | null; avatar_url: string | null; portfolio_images: string[] | null;
      };
      return ((data as unknown as MyProfile[])?.[0] ?? null) as MyProfile | null;
    },
  });

  const [step, setStep] = useState(1);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [portfolioImages, setPortfolioImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

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
        offers_emergency_service:
          existingArtisan.offers_emergency_service ?? false,
        available_weekends:
          existingArtisan.available_weekends ?? false,
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
      const { data, error } = await supabase
        .from("states")
        .select("id, name")
        .order("name");

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
      const errors = form.formState.errors;
      if (errors.bio) {
        toast.error("Please tell customers more about yourself. Your bio needs at least 30 characters.");
      } else {
        toast.error("Please complete all required fields correctly.");
      }
    }
  };

  const handleAdvanceToReview = () => {
    if (!profilePhoto) {
      toast.error("Please attach a professional profile photo.");
      return;
    }
    if (portfolioImages.length < 3) {
      toast.error("Please upload at least 3 samples of your previous work.");
      return;
    }
    setStep(4);
  };

  const selectedStateName = states.find((s: any) => s.id === watch.state)?.name || "";
  const selectedLgaName = lgas.find((l: any) => l.id === watch.lga)?.name || "";

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setSubmitting(true);

    try {
      let avatarUrl = "";
      let portfolioUrls: string[] = [];

      if (profilePhoto) {
        const fileExt = profilePhoto.name.split(".").pop();

        // ❌ OLD: `artisans/${user.id}/avatar-${Date.now()}.${fileExt}`
        // ✅ NEW: Start directly with user.id
        const filePath = `${user.id}/artisan-avatar-${Date.now()}.${fileExt}`;

        const { error: avatarErr } = await supabase.storage
          .from("listings")
          .upload(filePath, profilePhoto, { cacheControl: "3600", upsert: true });

        if (avatarErr) throw avatarErr;

        const { data: { publicUrl } } = supabase.storage
          .from("listings")
          .getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      if (portfolioImages.length > 0) {
        for (const file of portfolioImages) {
          const fileExt = file.name.split(".").pop();

          // ❌ OLD: `artisans/${user.id}/portfolio-${crypto.randomUUID()}.${fileExt}`
          // ✅ NEW: Start directly with user.id
          const filePath = `${user.id}/artisan-portfolio-${crypto.randomUUID()}.${fileExt}`;

          const { error: portErr } = await supabase.storage
            .from("listings")
            .upload(filePath, file);

          if (portErr) throw portErr;

          const { data: { publicUrl } } = supabase.storage
            .from("listings")
            .getPublicUrl(filePath);

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
          artisan_status: isPrelaunch ? "pending" : "approved",
          starting_price: values.starting_price || null,
          offers_home_service: values.offers_home_service,
          offers_emergency_service: values.offers_emergency_service,
          available_weekends: values.available_weekends,
          avatar_url:
            avatarUrl ||
            existingArtisan?.avatar_url ||
            existingArtisan?.profile_photo,

          profile_photo:
            avatarUrl ||
            existingArtisan?.profile_photo ||
            existingArtisan?.avatar_url,

          portfolio_images:
            portfolioUrls.length > 0
              ? portfolioUrls
              : (existingArtisan?.portfolio_images ?? undefined),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(
        isPrelaunch
          ? "Profile submitted for Admin review. It will remain private until Tile launches."
          : existingArtisan?.is_artisan
            ? "Artisan profile updated successfully."
            : "Your artisan profile is now available on Tile."
      );
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Could not synchronize profile settings.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto max-w-xl px-4 py-24 text-center">
          <h1 className="text-3xl font-bold">Become a Tile Artisan</h1>
          <p className="mt-4 text-muted-foreground">
            Create your professional profile so customers can discover and contact you anywhere in Nigeria.
          </p>
          <Button asChild className="mt-8">
            <Link to="/auth">Sign in to continue</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-3xl px-4 py-10">
        {isPrelaunch && (
          <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="font-semibold text-primary">Tile is currently in pre-launch.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You can complete your artisan profile now. It will be reviewed by Admin and remain private until the marketplace launches.
            </p>
          </div>
        )}

        {postingDisabled && (
          <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="font-semibold text-destructive">New marketplace submissions are temporarily disabled.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Submitting new artisan profile changes is currently paused.
            </p>
          </div>
        )}

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Become a Tile Pro</h1>
          <p className="mt-3 text-muted-foreground">
            Join the professional network of verified service providers and installers across Nigeria.
          </p>
        </div>

        <div className="mb-8">
          <Progress value={step * 25} className="h-2" />
          <p className="text-sm text-center mt-2 text-muted-foreground font-medium">
            Step {step} of 4
          </p>
        </div>

        <Card className="overflow-hidden border shadow-sm">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* STEP 1: Onboarding Introduction */}
            {step === 1 && (
              <div className="p-8">
                <div className="text-center">
                  <div className="flex justify-center mb-5">
                    <UserRound className="h-16 w-16 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold">Become a Tile Artisan</h2>
                  <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
                    Create your professional profile so customers across Nigeria can discover your skills, view your previous work and contact you directly.
                  </p>
                </div>

                <div className="mt-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Appear in local artisan search results</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Build trust with a complete professional profile</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Showcase photos of your previous projects</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Receive enquiries directly from customers</span>
                  </div>
                </div>

                <div className="mt-10 rounded-xl border bg-muted/30 p-5">
                  <h3 className="font-semibold mb-4">How it works</h3>
                  <div className="space-y-3 text-sm">
                    <p>1️⃣ Create your artisan profile</p>
                    <p>2️⃣ Upload your portfolio</p>
                    <p>3️⃣ Customers contact you directly</p>
                  </div>
                </div>

                <Button className="w-full mt-10" size="lg" type="button" onClick={() => setStep(2)} disabled={postingDisabled}>
                  Create My Profile
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}

            {/* STEP 2: Basic Identity Configuration */}
            {step === 2 && (
              <div className="p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Basic Information</h2>
                  <p className="text-muted-foreground mt-2">Tell customers who you are and what you do.</p>
                </div>

                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input placeholder="John Doe" {...form.register("full_name")} />
                </div>

                <div className="space-y-2">
                  <Label>Profession</Label>
                  <Select
                    value={watch.profession}
                    onValueChange={(value) =>
                      form.setValue("profession", value, { shouldValidate: true, shouldDirty: true })
                    }
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="08012345678" {...form.register("phone")} />
                </div>

                <div className="space-y-2">
                  <Label>WhatsApp Number (Optional)</Label>
                  <Input placeholder="08012345678" {...form.register("whatsapp")} />
                </div>

                <div className="space-y-2">
                  <Label>State</Label>
                  <Select
                    value={watch.state}
                    onValueChange={(value) => {
                      form.setValue("state", value, { shouldValidate: true, shouldDirty: true });
                      form.setValue("lga", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state: any) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Local Government Area</Label>
                  <Select
                    disabled={!watch.state}
                    value={watch.lga}
                    onValueChange={(value) => form.setValue("lga", value, { shouldValidate: true, shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Local Government" />
                    </SelectTrigger>
                    <SelectContent>
                      {lgas.map((lga: any) => (
                        <SelectItem key={lga.id} value={lga.id}>
                          {lga.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input type="number" placeholder="5" {...form.register("years_experience")} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Professional Bio</Label>
                    <span
                      className={`text-xs ${(watch.bio?.length ?? 0) >= 30
                        ? "text-green-600 font-medium"
                        : "text-muted-foreground"
                        }`}
                    >
                      {watch.bio?.length ?? 0}/500 characters
                    </span>
                  </div>
                  <Textarea
                    rows={6}
                    maxLength={500}
                    placeholder="Tell customers about your experience, skills, projects and why they should hire you..."
                    {...form.register("bio")}
                  />
                  <p
                    className={`text-xs ${(watch.bio?.length ?? 0) >= 30
                      ? "text-green-600"
                      : "text-orange-600 font-medium"
                      }`}
                  >
                    Minimum 30 characters required. Tell customers what makes you stand out.
                  </p>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={() => setStep(1)} type="button">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="button" onClick={handleValidateBasicInfo}>
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Portfolio & Scope Settings */}
            {step === 3 && (
              <div className="p-8 space-y-8">
                <div className="flex items-center gap-3">
                  <Images className="h-8 w-8 text-primary" />
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Portfolio & Setup</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      This is what customers will look at before they initiate contact with you.
                    </p>
                  </div>
                </div>

                {/* Profile Photo Section */}
                <Card className="p-6 border-dashed border-2 flex flex-col items-center bg-muted/5">
                  <Camera className="h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="font-semibold text-center text-sm flex items-center gap-2">
                    <UserRound className="h-4 w-4" /> Profile Photo
                  </h3>
                  <p className="text-xs text-muted-foreground text-center mt-1 max-w-xs">
                    Upload a clear, welcoming, and professional photo of yourself.
                  </p>

                  <div className="mt-4 flex flex-col items-center gap-3 w-full max-w-xs">
                    {profilePhoto && (
                      <div className="h-16 w-16 border rounded-full overflow-hidden shadow-inner">
                        <img src={URL.createObjectURL(profilePhoto)} alt="Avatar" className="h-full w-full object-cover" />
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
                    <Button variant="outline" className="w-full" type="button" onClick={() => avatarInputRef.current?.click()}>
                      {profilePhoto ? "Change Photo" : "Choose Photo"}
                    </Button>
                  </div>
                </Card>

                {/* Previous Jobs Portfolio Section */}
                <Card className="p-6 border-dashed border-2 bg-muted/5">
                  <div className="text-center max-w-md mx-auto mb-4">
                    <h3 className="font-semibold text-sm flex items-center justify-center gap-2">
                      <Images className="h-4 w-4" /> Previous Jobs
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload between 3 and 8 clear photos of real setup jobs or projects you have personally completed.
                    </p>
                    <p className="text-xs font-semibold mt-2 text-primary">
                      {portfolioImages.length}/8 uploaded
                    </p>
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
                        setPortfolioImages((prev) => [...prev, ...uploaded].slice(0, 8));
                      }}
                    />
                    <Button variant="outline" className="w-full max-w-xs" type="button" onClick={() => portfolioInputRef.current?.click()}>
                      Add Portfolio Photos
                    </Button>
                  </div>

                  {portfolioImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-3 mt-5">
                      {portfolioImages.map((file, idx) => (
                        <div key={idx} className="relative rounded-lg overflow-hidden border aspect-square bg-background">
                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPortfolioImages((p) => p.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-black/80 text-white rounded-full p-1 hover:bg-black transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Starting Price Field */}
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="starting_price" className="font-semibold text-sm flex items-center gap-2">
                    <BadgeDollarSign className="h-5 w-5 text-muted-foreground" /> Starting Price (Optional)
                  </Label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-muted-foreground text-sm">₦</span>
                    </div>
                    <Input
                      id="starting_price"
                      type="number"
                      className="pl-7"
                      placeholder="e.g. 15,000"
                      {...form.register("starting_price")}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Example: Starting from ₦15,000 per square meter or project base rate.
                  </p>
                </div>

                {/* Dynamic Network Availability Grid */}
                <div className="space-y-4 pt-2">
                  <Label className="font-semibold text-sm block border-b pb-2">
                    Service Terms & Availability Settings
                  </Label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Available for Work */}
                    <div className="flex items-start space-x-3 rounded-lg border p-3 shadow-sm bg-background">
                      <Controller
                        name="is_available"
                        control={form.control}
                        render={({ field }) => (
                          <Checkbox id="is_available" checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="is_available" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                          <UserRound className="h-3.5 w-3.5 text-muted-foreground" /> Available for work
                        </Label>
                        <p className="text-xs text-muted-foreground">Instantly show up in customer matching queues.</p>
                      </div>
                    </div>

                    {/* Home Service */}
                    <div className="flex items-start space-x-3 rounded-lg border p-3 shadow-sm bg-background">
                      <Controller
                        name="offers_home_service"
                        control={form.control}
                        render={({ field }) => (
                          <Checkbox id="offers_home_service" checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="offers_home_service" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                          <House className="h-3.5 w-3.5 text-muted-foreground" /> Home service
                        </Label>
                        <p className="text-xs text-muted-foreground">Open to traveling directly to client construction locations.</p>
                      </div>
                    </div>

                    {/* Emergency Support */}
                    <div className="flex items-start space-x-3 rounded-lg border p-3 shadow-sm bg-background">
                      <Controller
                        name="offers_emergency_service"
                        control={form.control}
                        render={({ field }) => (
                          <Checkbox id="offers_emergency_service" checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="offers_emergency_service" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-muted-foreground" /> Emergency service
                        </Label>
                        <p className="text-xs text-muted-foreground">Available for urgent repairs callouts outside standard hours.</p>
                      </div>
                    </div>

                    {/* Weekends */}
                    <div className="flex items-start space-x-3 rounded-lg border p-3 shadow-sm bg-background">
                      <Controller
                        name="available_weekends"
                        control={form.control}
                        render={({ field }) => (
                          <Checkbox id="available_weekends" checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="available_weekends" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /> Weekend Availability
                        </Label>
                        <p className="text-xs text-muted-foreground">Accept appointments over Saturdays and Sundays.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={() => setStep(2)} type="button">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="button" onClick={handleAdvanceToReview} disabled={portfolioImages.length < 3}>
                    Continue to Review
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: Premium Live Profile Card Review Layout */}
            {step === 4 && (
              <div className="p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Review Profile Card</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {isPrelaunch
                      ? "Review the information you are submitting to Admin. Your profile will remain private until launch."
                      : "Review your professional profile before publishing it publicly."}
                  </p>
                </div>

                <div className="max-w-md mx-auto w-full border rounded-xl shadow-lg bg-card overflow-hidden">
                  <div className="bg-primary/5 p-6 flex flex-col items-center text-center relative border-b">
                    {watch.is_available && (
                      <span className="absolute top-4 right-4 bg-green-500/10 text-green-700 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Available Today
                      </span>
                    )}

                    <div className="h-24 w-24 rounded-full border-4 border-background overflow-hidden bg-muted shadow-md mb-3">
                      {profilePhoto ? (
                        <img src={URL.createObjectURL(profilePhoto)} alt="Avatar Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-muted">
                          <UserRound className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-foreground flex items-center gap-1.5">
                      {watch.full_name || "John Doe"}
                    </h3>
                    <p className="text-sm font-medium text-primary mt-0.5">{watch.profession || "Verified Installer"}</p>

                    <div className="flex items-center gap-0.5 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < 4 ? "text-amber-500 fill-amber-500" : "text-muted border-muted"}`} />
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-4 text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" /> {watch.years_experience || 0} years experience
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {selectedStateName || "Lagos"} • {selectedLgaName || "Ikeja"}
                      </span>
                    </div>

                    {watch.starting_price && (
                      <div className="mt-4 bg-background border rounded-lg px-4 py-1.5 text-xs font-bold text-foreground shadow-sm">
                        Starting From ₦{Number(watch.starting_price).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-4 text-sm">
                    <div>
                      <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase mb-1.5">About</h4>
                      <p className="text-muted-foreground leading-relaxed italic">
                        "{watch.bio || "No profile bio written yet..."}"
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase mb-2">Portfolio Showcase</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {portfolioImages.map((file, idx) => (
                          <div key={idx} className="aspect-square rounded-md overflow-hidden border bg-muted shadow-sm">
                            <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-muted-foreground">
                      <div className={`p-2 rounded-md border ${watch.offers_home_service ? "bg-green-500/5 text-green-700 border-green-200/50" : "opacity-40"}`}>
                        Home Service {watch.offers_home_service ? "✓" : "✗"}
                      </div>
                      <div className={`p-2 rounded-md border ${watch.offers_emergency_service ? "bg-green-500/5 text-green-700 border-green-200/50" : "opacity-40"}`}>
                        Emergency {watch.offers_emergency_service ? "✓" : "✗"}
                      </div>
                      <div className={`p-2 rounded-md border ${watch.available_weekends ? "bg-green-500/5 text-green-700 border-green-200/50" : "opacity-40"}`}>
                        Weekends {watch.available_weekends ? "✓" : "✗"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={() => setStep(3)} type="button" disabled={submitting}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="submit" disabled={submitting || postingDisabled}>
                    {submitting
                      ? "Submitting Profile..."
                      : isPrelaunch
                        ? "Submit Profile for Admin Review"
                        : "Publish Profile Now"}
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
