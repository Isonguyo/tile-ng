import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { uploadListingImages } from "@/lib/storage";
import { toast } from "sonner";
import {
  Upload,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Package,
  Wrench,
} from "lucide-react";

export const Route = createFileRoute("/post-ad")({
  head: () => ({ meta: [{ title: "Post an Ad — Tile" }] }),
  component: PostAd,
});

const schema = z.object({
  category: z.string().min(1, "Choose a category"),
  type: z.enum(["goods", "service"]),
  title: z.string().min(5, "Title is too short").max(120),
  description: z.string().min(20, "Tell buyers more").max(2000),
  state_id: z.string().uuid("Please select a state"),
  city_id: z.string().uuid("Please select a city"),
  lga_id: z.string().uuid("Please select an LGA"),
  phone: z.string().min(7),
  price: z.coerce.number().positive().optional(),
  condition: z.enum(["new", "used_like_new", "used_good", "used_fair"]).optional(),
  brand: z.string().optional(),
  years_experience: z.coerce.number().int().min(0).max(80).optional(),
  service_mode: z.enum(["remote", "in_person", "both"]).optional(),
});
type FormVals = z.infer<typeof schema>;

function PostAd() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  
  const TOTAL_STEPS = 4;

  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { type: "goods" },
  });
  const watch = form.watch();

  const nextStep = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const selectListingType = (type: "goods" | "service") => {
    form.setValue("type", type);
    form.setValue("category", "");
    setStep(2);
  };

  // Optional: Placeholder logic for location detection feature
  const handleDetectLocation = () => {
    toast.info("Location detection features coming soon.");
  };

  // Cascade Metadata Queries Hooked onto React-Form internal state values
  const { data: states = [] } = useQuery({
    queryKey: ["post-states"],
    queryFn: async () => {
      const { data, error } = await supabase.from("states").select("id, name").order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: cities = [] } = useQuery({
    queryKey: ["post-cities", watch.state_id],
    queryFn: async () => {
      if (!watch.state_id) return [];
      const { data, error } = await supabase.from("cities").select("id, name").eq("state_id", watch.state_id).order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!watch.state_id,
  });

  const { data: lgas = [] } = useQuery({
    queryKey: ["post-lgas", watch.city_id],
    queryFn: async () => {
      if (!watch.city_id) return [];
      const { data, error } = await supabase.from("lgas").select("id, name").eq("city_id", watch.city_id).order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!watch.city_id,
  });

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

  const onSubmit = async (vals: FormVals) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { data: ok, error: qErr } = await supabase.rpc("check_post_quota", { _type: vals.type });
      if (qErr) throw qErr;
      if (!ok) {
        toast.error("Plan posting threshold quota reached.");
        setSubmitting(false);
        return;
      }

      let imagePaths: string[] = [];
      if (files.length) imagePaths = await uploadListingImages(user.id, files);

      const { data, error } = await supabase.from("listings").insert({
        user_id: user.id,
        type: vals.type,
        category: vals.category,
        title: vals.title,
        description: vals.description,
        state_id: vals.state_id,
        city_id: vals.city_id,
        lga_id: vals.lga_id,
        phone: vals.phone,
        price: vals.price ?? null,
        condition: vals.type === "goods" ? vals.condition : null,
        brand: vals.type === "goods" ? vals.brand : null,
        years_experience: vals.type === "service" ? vals.years_experience : null,
        service_mode: vals.type === "service" ? vals.service_mode : null,
        images: imagePaths,
        status: "approved"
      }).select().single();

      if (error) throw error;
      toast.success("Ad submitted successfully!");
      nav({ to: "/listing/$id", params: { id: data.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post ad parameters");
    } finally { setSubmitting(false); }
  };

  const onInvalid = (errors: any) => {
    const first = Object.keys(errors)[0];
    if (first) {
      toast.error(`Error on validation parameter: ${first}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold">Post an Ad</h1>
        <div className="flex items-center gap-2 my-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex-1 h-2 rounded-full ${step >= s ? "bg-accent" : "bg-muted"}`} />
          ))}
        </div>

        <Card className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-5">
            {step === 1 && (
              <>
                <h2 className="text-2xl font-bold">What would you like to post?</h2>
                <p className="text-sm text-muted-foreground">
                  Choose whether you're selling a physical product or offering a professional service.
                </p>

                <div className="grid gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => selectListingType("goods")}
                    className={`rounded-xl border-2 p-5 text-left transition-all ${
                      watch.type === "goods"
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/40"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold">📦 Sell a Product</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Phones, laptops, cars, land, fashion, furniture, food, electronics and other physical items.
                        </p>
                      </div>
                      {watch.type === "goods" && <Check className="h-6 w-6 text-accent" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectListingType("service")}
                    className={`rounded-xl border-2 p-5 text-left transition-all ${
                      watch.type === "service"
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/40"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold">🛠 Offer a Service</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Photography, plumbing, barbering, electrical work, tutoring, software development, catering and other professional services.
                        </p>
                      </div>
                      {watch.type === "service" && <Check className="h-6 w-6 text-accent" />}
                    </div>
                  </button>
                </div>

                <div className="mt-6">
                  <Label className="mb-2 block">Category</Label>
                  <Select
                    value={watch.category}
                    onValueChange={(v) => form.setValue("category", v, { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select a ${watch.type} category`} />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter((c) => c.type === watch.type).map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button type="button" disabled={!watch.category} onClick={nextStep}>
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-2xl font-bold">Tell buyers about your {watch.type === "goods" ? "product" : "service"}</h2>
                <div>
                  <Label>Title</Label>
                  <Input
                    {...form.register("title")}
                    placeholder={watch.type === "goods" ? "Samsung Galaxy S24 Ultra 256GB" : "Professional Wedding Photographer"}
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    rows={5}
                    {...form.register("description")}
                    placeholder={watch.type === "goods" ? "Condition, specifications, warranty, reason for selling..." : "Describe your experience, what clients should expect, availability and pricing..."}
                  />
                </div>

                <div>
                  <Label>{watch.type === "goods" ? "Price (₦)" : "Starting Price (₦)"}</Label>
                  <Input type="number" {...form.register("price")} placeholder="50000" />
                </div>

                {watch.type === "goods" && (
                  <>
                    <div>
                      <Label>Brand</Label>
                      <Input {...form.register("brand")} placeholder="Apple, Samsung, Toyota..." />
                    </div>
                    <div>
                      <Label>Condition</Label>
                      <Select value={watch.condition} onValueChange={(v) => form.setValue("condition", v as FormVals["condition"])}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Brand New</SelectItem>
                          <SelectItem value="used_like_new">Used - Like New</SelectItem>
                          <SelectItem value="used_good">Used - Good</SelectItem>
                          <SelectItem value="used_fair">Used - Fair</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {watch.type === "service" && (
                  <>
                    <div>
                      <Label>Years of Experience</Label>
                      <Input type="number" {...form.register("years_experience")} />
                    </div>
                    <div>
                      <Label>Service Delivery</Label>
                      <Select value={watch.service_mode} onValueChange={(v) => form.setValue("service_mode", v as FormVals["service_mode"])}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose service mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="in_person">In Person</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="button" onClick={nextStep}>
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-2xl font-bold">Location & Contact</h2>
                <div className="space-y-5 border rounded-xl p-5 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Location</h3>
                      <p className="text-sm text-muted-foreground">Select where this item or service is available.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleDetectLocation}>
                      Detect My Location
                    </Button>
                  </div>

                  <div>
                    <Label>State</Label>
                    <Select
                      value={watch.state_id}
                      onValueChange={(v) => {
                        form.setValue("state_id", v);
                        form.setValue("city_id", "");
                        form.setValue("lga_id", "");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose State" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>City</Label>
                    <Select
                      disabled={!watch.state_id}
                      value={watch.city_id}
                      onValueChange={(v) => {
                        form.setValue("city_id", v);
                        form.setValue("lga_id", "");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose City" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Local Government Area</Label>
                    <Select disabled={!watch.city_id} value={watch.lga_id} onValueChange={(v) => form.setValue("lga_id", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose LGA" />
                      </SelectTrigger>
                      <SelectContent>
                        {lgas.map((l) => (
                          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Photos</Label>
                  <div className="border-2 border-dashed rounded-xl p-6 text-center">
                    <input
                      id="listing-images"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (!e.target.files) return;
                        const selected = Array.from(e.target.files);
                        setFiles((prev) => [...prev, ...selected].slice(0, 8));
                      }}
                    />
                    <label htmlFor="listing-images" className="cursor-pointer flex flex-col items-center gap-3">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Click to upload photos</p>
                        <p className="text-sm text-muted-foreground">Maximum of 8 images</p>
                      </div>
                    </label>
                  </div>

                  {files.length > 0 && (
                    <div className="grid grid-cols-4 gap-3">
                      {files.map((file, index) => (
                        <div key={index} className="relative rounded-lg overflow-hidden border aspect-square">
                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Contact Phone Number</Label>
                  <Input {...form.register("phone")} placeholder="08012345678" />
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-accent text-accent-foreground">
                    <Check className="h-4 w-4 mr-2" />
                    {submitting
                      ? "Publishing..."
                      : watch.type === "goods"
                      ? "Publish Product"
                      : "Publish Service"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
