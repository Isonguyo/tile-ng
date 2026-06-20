import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Upload, X, ChevronRight, ChevronLeft, Check, Locate, Loader2 } from "lucide-react";

export const Route = createFileRoute("/post-ad")({
  head: () => ({ meta: [{ title: "Post an Ad — Tile" }] }),
  component: PostAd,
});

// Hardcoded baseline Nigerian States Fallback to guarantee UI rendering
const FALLBACK_NIGERIAN_STATES = [
  { id: "abia-uuid-placeholder", name: "Abia" },
  { id: "adamawa-uuid-placeholder", name: "Adamawa" },
  { id: "akwa-ibom-uuid-placeholder", name: "Akwa Ibom" },
  { id: "anambra-uuid-placeholder", name: "Anambra" },
  { id: "bauchi-uuid-placeholder", name: "Bauchi" },
  { id: "bayelsa-uuid-placeholder", name: "Bayelsa" },
  { id: "benue-uuid-placeholder", name: "Benue" },
  { id: "borno-uuid-placeholder", name: "Borno" },
  { id: "cross-river-uuid-placeholder", name: "Cross River" },
  { id: "delta-uuid-placeholder", name: "Delta" },
  { id: "ebonyi-uuid-placeholder", name: "Ebonyi" },
  { id: "edo-uuid-placeholder", name: "Edo" },
  { id: "ekiti-uuid-placeholder", name: "Ekiti" },
  { id: "enugu-uuid-placeholder", name: "Enugu" },
  { id: "fct-uuid-placeholder", name: "Federal Capital Territory" },
  { id: "gombe-uuid-placeholder", name: "Gombe" },
  { id: "imo-uuid-placeholder", name: "Imo" },
  { id: "jigawa-uuid-placeholder", name: "Jigawa" },
  { id: "kaduna-uuid-placeholder", name: "Kaduna" },
  { id: "kano-uuid-placeholder", name: "Kano" },
  { id: "katsina-uuid-placeholder", name: "Katsina" },
  { id: "kebbi-uuid-placeholder", name: "Kebbi" },
  { id: "kogi-uuid-placeholder", name: "Kogi" },
  { id: "kwara-uuid-placeholder", name: "Kwara" },
  { id: "lagos-uuid-placeholder", name: "Lagos" },
  { id: "nasarawa-uuid-placeholder", name: "Nasarawa" },
  { id: "niger-uuid-placeholder", name: "Niger" },
  { id: "ogun-uuid-placeholder", name: "Ogun" },
  { id: "ondo-uuid-placeholder", name: "Ondo" },
  { id: "osun-uuid-placeholder", name: "Osun" },
  { id: "oyo-uuid-placeholder", name: "Oyo" },
  { id: "plateau-uuid-placeholder", name: "Plateau" },
  { id: "rivers-uuid-placeholder", name: "Rivers" },
  { id: "sokoto-uuid-placeholder", name: "Sokoto" },
  { id: "taraba-uuid-placeholder", name: "Taraba" },
  { id: "yobe-uuid-placeholder", name: "Yobe" },
  { id: "zamfara-uuid-placeholder", name: "Zamfara" }
];

const schema = z.object({
  category: z.string().min(1, "Choose a category"),
  type: z.enum(["goods", "service"]),
  title: z.string().min(5, "Title is too short").max(120),
  description: z.string().min(20, "Tell buyers more details about your item or service").max(2000),
  state_id: z.string().min(1, "Please select a state"), // Altered from uuid validation so fallback text works seamlessly
  city_id: z.string().min(1, "Please select a city"),
  lga_id: z.string().min(1, "Please select an LGA"),
  phone: z.string().regex(/^(\+234|0)[789][01]\d{8}$/, "Enter a valid Nigerian phone number (e.g. 08031234567)"),
  price: z.coerce.number().positive("Price must be greater than zero").optional(),
  condition: z.enum(["new", "used_like_new", "used_good", "used_fair"]).optional(),
  brand: z.string().optional(),
  years_experience: z.coerce.number().int().min(0).max(80).optional(),
  service_mode: z.enum(["remote", "in_person", "both"]).optional(),
});
type FormVals = z.infer<typeof schema>;

const DRAFT_STORAGE_KEY = "tile-post-draft";

function PostAd() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { type: "goods", category: "" },
  });
  const watch = form.watch();

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        form.reset(parsed);
        toast.info("Unsaved draft recovered successfully.");
      } catch (e) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    }
  }, [form]);

  useEffect(() => {
    const values = form.getValues();
    if (values.title || values.description || values.phone) {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(values));
    }
  }, [watch.title, watch.description, watch.phone, watch.category, watch.state_id, watch.city_id, watch.lga_id]);

  // Hooked up with local state array fallback injection below
  const { data: dbStates } = useQuery({
    queryKey: ["post-states"],
    queryFn: async () => {
      const { data, error } = await supabase.from("states").select("id, name").order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const states = dbStates && dbStates.length > 0 ? dbStates : FALLBACK_NIGERIAN_STATES;

  const { data: cities = [] } = useQuery({
    queryKey: ["post-cities", watch.state_id],
    queryFn: async () => {
      if (!watch.state_id || watch.state_id.includes("placeholder")) return [];
      const { data, error } = await supabase.from("cities").select("id, name").eq("state_id", watch.state_id).order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!watch.state_id && !watch.state_id.includes("placeholder"),
  });

  const { data: lgas = [] } = useQuery({
    queryKey: ["post-lgas", watch.city_id],
    queryFn: async () => {
      if (!watch.city_id || watch.city_id.includes("placeholder")) return [];
      const { data, error } = await supabase.from("lgas").select("id, name").eq("city_id", watch.city_id).order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!watch.city_id && !watch.city_id.includes("placeholder"),
  });

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      return toast.error("Location services are disabled or unsupported by your browser.");
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { data: geoData, error } = await supabase.rpc("find_nearest_city", {
          user_lat: pos.coords.latitude,
          user_lng: pos.coords.longitude,
        });
        setIsLocating(false);
        if (error || !geoData?.[0]) {
          return toast.error("Unable to match location vectors to the database.");
        }
        form.setValue("state_id", geoData[0].state_id, { shouldValidate: true });
        setTimeout(() => {
          form.setValue("city_id", geoData[0].city_id, { shouldValidate: true });
          toast.success("Location synced successfully!");
        }, 150);
      },
      () => {
        setIsLocating(false);
        toast.error("Location permission denied. Please select manually.");
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (files.length + selected.length > 12) {
      toast.error("Maximum 12 images allowed per advertisement listing.");
      return;
    }
    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
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

  const onSubmit = async (vals: FormVals) => {
    if (!user) return;
    if (submitting) return;
    
    if (vals.type === "goods" && files.length === 0) {
      toast.error("At least one product photo upload is required to list physical items.");
      return;
    }

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

      const stateObj = states.find((s) => s.id === vals.state_id);
      const cityObj = cities.find((c) => c.id === vals.city_id);
      const lgaObj = lgas.find((l) => l.id === vals.lga_id);

      const stateName = stateObj ? stateObj.name : "";
      const cityName = cityObj ? cityObj.name : "General";
      const lgaName = lgaObj ? lgaObj.name : "General";
      const readableLocation = cityName ? `${cityName}, ${stateName}` : stateName;

      const { data, error } = await supabase.from("listings").insert({
        user_id: user.id,
        type: vals.type,
        category: vals.category,
        title: vals.title,
        description: vals.description,
        state_id: vals.state_id.includes("placeholder") ? null : vals.state_id,
        city_id: vals.city_id.includes("placeholder") ? null : vals.city_id,
        lga_id: vals.lga_id.includes("placeholder") ? null : vals.lga_id,
        state_name: stateName,
        city_name: cityName,
        lga_name: lgaName,
        location: readableLocation,
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
      
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      form.reset();
      setFiles([]);
      setStep(1);
      
      toast.success("Your ad is now live and visible to buyers across Nigeria.");
      queryClient.invalidateQueries({ queryKey: ["listings-infinite"] });
      nav({ to: "/listing/$id", params: { id: data.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post ad parameters");
    } finally { setSubmitting(false); }
  };

  const onInvalid = (errors: any) => {
    const first = Object.keys(errors)[0];
    if (first) {
      toast.error(`Validation Error: ${errors[first]?.message || first}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold">Post an Ad</h1>
        <div className="flex items-center gap-2 my-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-2 rounded-full ${step >= s ? "bg-accent" : "bg-muted"}`} />
          ))}
        </div>

        <Card className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-5">
            {step === 1 && (
              <>
                <h2 className="text-xl font-semibold">Step 1 — Choose category</h2>
                <div className="flex gap-2">
                  {(["goods", "service"] as const).map((t) => (
                    <button type="button" key={t} onClick={() => { form.setValue("type", t); form.setValue("category", ""); }}
                      className={`flex-1 p-4 rounded-lg border-2 capitalize font-semibold ${watch.type === t ? "border-accent bg-accent/10" : "border-border"}`}>
                      {t === "goods" ? "Sell goods" : "Offer a service"}
                    </button>
                  ))}
                </div>
                <div>
                  <Label>Category</Label>
                  <Controller
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Pick one…" /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.filter((c) => c.type === watch.type).map((c) => (
                            <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="button" disabled={!watch.category} onClick={() => setStep(2)}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-xl font-semibold">Step 2 — Details</h2>
                <div>
                  <Label>Title</Label>
                  <Input {...form.register("title")} placeholder="e.g. Clean Toyota Corolla 2018" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea {...form.register("description")} rows={4} placeholder="Describe your item or service terms..." />
                </div>
                <div>
                  <Label>Price (₦)</Label>
                  <Input type="number" {...form.register("price")} placeholder="Leave blank if Negotiable" />
                </div>

                {watch.type === "goods" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <Label>Condition</Label>
                      <Controller
                        control={form.control}
                        name="condition"
                        render={({ field }) => (
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger><SelectValue placeholder="Select Condition" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">Brand New</SelectItem>
                              <SelectItem value="used_like_new">Used (Like New)</SelectItem>
                              <SelectItem value="used_good">Used (Good)</SelectItem>
                              <SelectItem value="used_fair">Used (Fair)</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div>
                      <Label>Brand / Manufacturer</Label>
                      <Input {...form.register("brand")} placeholder="e.g. Apple, Toyota, Samsung" />
                    </div>
                  </div>
                )}

                {watch.type === "service" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <Label>Years of Experience</Label>
                      <Input type="number" {...form.register("years_experience")} placeholder="e.g. 5" />
                    </div>
                    <div>
                      <Label>Service Mode</Label>
                      <Controller
                        control={form.control}
                        name="service_mode"
                        render={({ field }) => (
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger><SelectValue placeholder="Select working method" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="remote">Remote (Virtual)</SelectItem>
                              <SelectItem value="in_person">In Person (Physical)</SelectItem>
                              <SelectItem value="both">Both Available</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
                  <Button type="button" onClick={async () => {
                    const validationKeys: Array<keyof FormVals> = ["title", "description"];
                    if (watch.type === "goods") validationKeys.push("condition");
                    if (watch.type === "service") validationKeys.push("service_mode");
                    
                    const valid = await form.trigger(validationKeys);
                    if (valid) setStep(3);
                  }}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-xl font-semibold">Step 3 — Media & Location Hierarchy</h2>
                
                <div className="space-y-2">
                  <Label>Upload Photos {watch.type === "goods" && <span className="text-destructive">*</span>}</Label>
                  <div className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 relative bg-muted/10 transition">
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs font-semibold text-foreground">Click to upload or drag images here</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Up to 12 images. High-quality landscape shots preferred.</p>
                  </div>

                  {files.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-2">
                      {files.map((file, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                          <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-destructive transition">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4 border p-4 rounded-xl bg-muted/20 relative">
                  <div className="flex justify-between items-center mb-1">
                    <Label className="font-bold">Location Hierarchy</Label>
                    <Button type="button" size="sm" variant="outline" onClick={handleNearMe} disabled={isLocating} className="text-xs h-7 flex gap-1 items-center">
                      {isLocating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Locate className="h-3 w-3" />}
                      Detect City
                    </Button>
                  </div>

                  <div>
                    <Label>State Selection</Label>
                    <Controller
                      control={form.control}
                      name="state_id"
                      render={({ field }) => (
                        <Select 
                          value={field.value || ""} 
                          onValueChange={(v) => {
                            field.onChange(v);
                            form.setValue("city_id", "", { shouldValidate: true });
                            form.setValue("lga_id", "", { shouldValidate: true });
                          }}
                        >
                          <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Select State" /></SelectTrigger>
                          <SelectContent>
                            {states.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <Label>City Selection</Label>
                    <Controller
                      control={form.control}
                      name="city_id"
                      render={({ field }) => (
                        <Select 
                          disabled={!watch.state_id} 
                          value={field.value || ""} 
                          onValueChange={(v) => {
                            field.onChange(v);
                            form.setValue("lga_id", "", { shouldValidate: true });
                          }}
                        >
                          <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Select City" /></SelectTrigger>
                          <SelectContent>
                            {cities.length > 0 ? (
                              cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                            ) : (
                              <SelectItem value="city-placeholder">Select State First / General</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <Label>Local Government Area (LGA)</Label>
                    <Controller
                      control={form.control}
                      name="lga_id"
                      render={({ field }) => (
                        <Select 
                          disabled={!watch.city_id} 
                          value={field.value || ""} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Select LGA" /></SelectTrigger>
                          <SelectContent>
                            {lgas.length > 0 ? (
                              lgas.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)
                            ) : (
                              <SelectItem value="lga-placeholder">Select City First / General</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <Label>Contact Phone Number</Label>
                  <Input {...form.register("phone")} placeholder="e.g. 08031234567" />
                </div>

                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
                  <Button type="submit" disabled={submitting} className="bg-accent text-accent-foreground min-w-[150px]">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Publish Advertisement
                      </>
                    )}
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
