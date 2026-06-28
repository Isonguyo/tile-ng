import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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

  // FIXED: Added "id" to the select statement so state.id is populated correctly
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

  const onSubmit = async (vals: FormValues) => {
    if (!user) return;
    setSubmitting(true);
    try {
      let avatarUrl = "";
      let portfolioUrls: string[] = [];

      // Optional placeholder logic for files:
      // Insert your custom edge functions or Supabase storage upload methods if needed
      if (profilePhoto) {
        const fileExt = profilePhoto.name.split(".").pop();
        const filePath = `${user.id}/avatar-${Math.random()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(filePath, profilePhoto);
        if (!uploadErr) avatarUrl = filePath;
      }

      const { error } = await supabase.from("artisans").insert({
        user_id: user.id,
        full_name: vals.full_name,
        profession: vals.profession,
        bio: vals.bio,
        phone: vals.phone,
        whatsapp: vals.whatsapp || null,
        state_id: vals.state,
        lga_id: vals.lga,
        years_experience: vals.years_experience,
        avatar_url: avatarUrl,
        portfolio_images: portfolioUrls,
        is_available: vals.is_available,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Artisan application submitted successfully!");
      navigate({ to: "/" });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalid = (errors: any) => {
    const first = Object.keys(errors)[0];
    if (first) {
      toast.error(`Validation error on field: ${first}`);
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
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold">Become a Tile Artisan</h1>
          <p className="mt-3 text-muted-foreground">
            Build your professional profile and start getting discovered by customers looking for trusted artisans.
          </p>
        </div>

        <Card className="overflow-hidden">
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
            {/* STEP 1: Welcome/Onboarding Screen */}
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

            {/* STEP 2: Basic Information Forms */}
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
                  <Button type="button" onClick={() => setStep(3)}>
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Media Upload Form Flow */}
            {step === 3 && (
              <div className="p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Profile Photo & Portfolio</h2>
                  <p className="text-muted-foreground mt-2">
                    Showcase your past projects and give your profile a welcoming professional presence.
                  </p>
                </div>

                {/* Profile Photo Upload */}
                <div className="space-y-3">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 border rounded-full bg-muted flex items-center justify-center overflow-hidden relative">
                      {profilePhoto ? (
                        <img src={URL.createObjectURL(profilePhoto)} alt="Avatar Preview" className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setProfilePhoto(e.target.files[0]);
                          }
                        }}
                      />
                      <Button variant="outline" type="button" asChild size="sm">
                        <label htmlFor="avatar-upload" className="cursor-pointer">
                          Upload Photo
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Multi-Portfolio Photo Uploader */}
                <div className="space-y-3">
                  <Label>Recent Projects Portfolio</Label>
                  <div className="border-2 border-dashed rounded-xl p-6 text-center bg-muted/10">
                    <input
                      id="portfolio-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (!e.target.files) return;
                        const uploaded = Array.from(e.target.files);
                        setPortfolioImages((prev) => [...prev, ...uploaded].slice(0, 6));
                      }}
                    />
                    <label htmlFor="portfolio-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">Upload context photos matching your layout setup</p>
                        <p className="text-xs text-muted-foreground">Up to 6 images max</p>
                      </div>
                    </label>
                  </div>

                  {portfolioImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {portfolioImages.map((file, idx) => (
                        <div key={idx} className="relative rounded-lg overflow-hidden border aspect-video">
                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPortfolioImages((p) => p.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={() => setStep(2)} type="button">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Profile"}
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
