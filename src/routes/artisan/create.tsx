import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";

export const Route = createFileRoute("/artisan/create")({
  component: ArtisanCreatePage,
});

const schema = z.object({
  full_name: z.string().min(2, "Enter your full name"),
  profession: z.string().min(1, "Select your profession"),
  bio: z
    .string()
    .min(30, "Tell customers about yourself")
    .max(500, "Bio is too long"),
  phone: z.string().min(10, "Enter a valid phone number"),
  whatsapp: z.string().optional(),
  state: z.string().min(1, "Select a state"),
  lga: z.string().min(1, "Select an LGA"),
  years_experience: z.coerce.number().min(0).max(80),
  is_available: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

function ArtisanCreatePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [portfolioImages, setPortfolioImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // File input DOM references
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      profession: "",
      bio: "",
      phone: "",
      whatsapp: "",
      state: "",
      lga: "",
      years_experience: 0,
      is_available: true,
    },
  });

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

  // Handle advancing from Step 2 to Step 3 with selective validation
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
      toast.error("Please fill out all required fields correctly before continuing.");
    }
  };

  // Step 4: Final Submission Logic to Supabase Storage and Profiles table
  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setSubmitting(true);

    try {
      let avatarUrl = "";
      let portfolioUrls: string[] = [];

      // 1. Process Profile Picture Storage upload if available
      if (profilePhoto) {
        const fileExt = profilePhoto.name.split(".").pop();
        const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;
        const { error: avatarErr } = await supabase.storage
          .from("avatars")
          .upload(filePath, profilePhoto, { cacheControl: "3600", upsert: true });
        
        if (avatarErr) throw avatarErr;
        avatarUrl = filePath;
      }

      // 2. Process Portfolio Media array uploads
      if (portfolioImages.length > 0) {
        for (const file of portfolioImages) {
          const fileExt = file.name.split(".").pop();
          const filePath = `${user.id}/portfolio-${Date.now()}-${Math.random().toString(36).substr(2, 5)}.${fileExt}`;
          const { error: portErr } = await supabase.storage
            .from("portfolios")
            .upload(filePath, file, { cacheControl: "3600", upsert: true });

          if (portErr) throw portErr;
          portfolioUrls.push(filePath);
        }
      }

      // 3. Update profiles schema entry with unified attributes
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: values.full_name,
          profession: values.profession,
          bio: values.bio,
          phone: values.phone,
          whatsapp: values.whatsapp || null,
          state: values.state,
          lga: values.lga,
          years_experience: values.years_experience,
          is_available: values.is_available,
          is_artisan: true,
          avatar_url: avatarUrl || undefined,
          portfolio_images: portfolioUrls, 
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Tile Pro Professional profile published successfully!");
      navigate({ to: "/" });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "An error occurred while saving your profile data.");
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

  // Helper variables for step 4 review presentation lookup
  const selectedStateName = states.find((s: any) => s.id === watch.state)?.name || "";
  const selectedLgaName = lgas.find((l: any) => l.id === watch.lga)?.name || "";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Become a Tile Pro</h1>
          <p className="mt-3 text-muted-foreground">
            Build your professional profile and start getting discovered by customers looking for vetted service providers.
          </p>
        </div>

        <Card className="overflow-hidden border shadow-sm">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* STEP 1: Introduction Screen */}
            {step === 1 && (
              <div className="p-8">
                <div className="text-center">
                  <div className="text-6xl mb-5">👷</div>
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
                  <div className="space-y-3">
                    <p>1️⃣ Create your artisan profile</p>
                    <p>2️⃣ Upload your portfolio</p>
                    <p>3️⃣ Customers contact you directly</p>
                  </div>
                </div>

                <Button className="w-full mt-10" size="lg" type="button" onClick={() => setStep(2)}>
                  Create My Profile
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}

            {/* STEP 2: Basic Identity Information */}
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
                          {category.icon} {category.label}
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
                  <Label>Professional Bio</Label>
                  <Textarea
                    rows={6}
                    placeholder="Tell customers about yourself, your experience, the services you provide and why they should hire you..."
                    {...form.register("bio")}
                  />
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

            {/* STEP 3: Portfolio Media Uploads */}
            {step === 3 && (
              <div className="p-8 space-y-8">
                <div>
                  <h2 className="text-2xl font-bold">Portfolio & Assets</h2>
                  <p className="text-muted-foreground mt-2">
                    Show customers real examples of your previous masonry or setup setups.
                  </p>
                </div>

                <Card className="p-6 bg-muted/20 border border-dashed">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <Camera className="h-4 w-4 text-primary" /> Profile Photo
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a clear profile image. Profiles with photos get up to 4x more visibility.
                  </p>
                  
                  <div className="mt-4 flex items-center gap-4">
                    <div className="h-16 w-16 border rounded-full bg-background flex items-center justify-center overflow-hidden relative">
                      {profilePhoto ? (
                        <img src={URL.createObjectURL(profilePhoto)} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
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
                      <Button variant="outline" type="button" size="sm" onClick={() => avatarInputRef.current?.click()}>
                        Choose File
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-muted/20 border border-dashed">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" /> Portfolio Images
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload 3–6 layout photos showing your absolute best work.
                  </p>

                  <div className="mt-4">
                    <input
                      type="file"
                      ref={portfolioInputRef}
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (!e.target.files) return;
                        const uploaded = Array.from(e.target.files);
                        setPortfolioImages((prev) => [...prev, ...uploaded].slice(0, 6));
                      }}
                    />
                    <Button variant="outline" type="button" size="sm" onClick={() => portfolioInputRef.current?.click()}>
                      Select Files
                    </Button>
                  </div>

                  {portfolioImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {portfolioImages.map((file, idx) => (
                        <div key={idx} className="relative rounded-lg overflow-hidden border aspect-video bg-background">
                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPortfolioImages((p) => p.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-black"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={() => setStep(2)} type="button">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="button" onClick={() => setStep(4)}>
                    Preview Profile
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: Review & Finalize Publish Details */}
            {step === 4 && (
              <div className="p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Review Your Profile</h2>
                  <p className="text-muted-foreground mt-2">
                    Here is how your professional business card looks to prospective clients.
                  </p>
                </div>

                <div className="border rounded-xl p-6 space-y-4 bg-muted/10">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 border rounded-full bg-background flex items-center justify-center overflow-hidden shrink-0">
                      {profilePhoto ? (
                        <img src={URL.createObjectURL(profilePhoto)} alt="Avatar Preview" className="h-full w-full object-cover" />
                      ) : (
                        <Briefcase className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-xl">{watch.full_name || "Untitled Name"}</h3>
                      <p className="text-sm font-medium text-primary flex items-center gap-1">
                        <span>👷</span> {watch.profession || "No Specialty Selected"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        📍 {selectedLgaName || "LGA"}, {selectedStateName || "State"} • ⭐ {watch.years_experience || 0} Years Exp.
                      </p>
                    </div>
                  </div>

                  <hr className="my-2" />

                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Professional Summary</span>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {watch.bio || "No professional summary added yet."}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <div>📞 Contact: <span className="text-foreground">{watch.phone || "Not Set"}</span></div>
                    {watch.whatsapp && (
                      <div>💬 WhatsApp: <span className="text-foreground">{watch.whatsapp}</span></div>
                    )}
                  </div>

                  {portfolioImages.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Project Media ({portfolioImages.length} items)
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {portfolioImages.map((file, i) => (
                          <div key={i} className="aspect-square border rounded-md overflow-hidden bg-background">
                            <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={() => setStep(3)} type="button" disabled={submitting}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Publishing Pro..." : "Confirm & Publish Profile"}
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
