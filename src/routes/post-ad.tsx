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
} from "lucide-react";

export const Route = createFileRoute("/post-ad")({
  head: () => ({ meta: [{ title: "Post an Ad — Tile" }] }),
  component: PostAd,
});

// STEP 8: Simplified the schema (removed service fields and type enum)
const schema = z.object({
  category: z.string().min(1, "Choose a category"),
  title: z.string().min(5, "Title is too short").max(120),
  description: z.string().min(20, "Tell buyers more").max(2000),
  state_id: z.string().uuid("Please select a state"),
  lga_id: z.string().uuid("Please select an LGA"),
  phone: z.string().min(7),
  price: z.coerce.number().positive().optional(),
  condition: z.enum(["new", "used_like_new", "used_good", "used_fair"]).optional(),
  brand: z.string().optional(),
});
type FormVals = z.infer<typeof schema>;

function PostAd() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  
  const TOTAL_STEPS = 3;

  // STEP 1: Introduce mode state before entering the wizard
  const [mode, setMode] = useState<"home" | "goods">("home");
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // STEP 9: Updated default values
  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });
  const watch = form.watch();

  const nextStep = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleDetectLocation = () => {
    toast.info("Location detection features coming soon.");
  };

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
      // STEP 10: hardcoded "goods" check for quota
      const { data: ok, error: qErr } = await supabase.rpc("check_post_quota", { _type: "goods" });
      if (qErr) throw qErr;
      if (!ok) {
        toast.error("Plan posting threshold quota reached.");
        setSubmitting(false);
        return;
      }

      let imagePaths: string[] = [];
      if (files.length) imagePaths = await uploadListingImages(user.id, files);

      const selectedState = states.find((s) => s.id === vals.state_id);
      const selectedLga = lgas.find((l) => l.id === vals.lga_id);

      const location = [selectedLga?.name, selectedState?.name]
        .filter(Boolean)
        .join(", ");

      // STEP 10 & 11: Cleaned insertion structure and modified status to pending
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

      if (error) {
        console.error(error);
        throw error;
      }

      // STEP 12: Success message improvement
      toast.success("Your listing has been submitted for review. It will appear after approval.");

      nav({
        to: "/listing/$id",
        params: { id: data.id },
      });
    } catch (e) {
      console.error("POST AD ERROR:", e);
      if (e && typeof e === "object" && "message" in e) {
        toast.error(String((e as any).message));
      } else {
        toast.error("Failed to post ad.");
      }
    } finally {
      setSubmitting(false);
    }
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
        {/* STEP 2: Changed page titles dynamically based on screen location */}
        <h1 className="text-3xl font-bold">Post on Tile</h1>
        <p className="text-muted-foreground mt-2 mb-6">
          {mode === "home" ? "Choose how you'd like to use Tile." : "Complete the steps below to upload your item."}
        </p>

        {/* STEP 3 & 4: Mode Wrapper Condition */}
        {mode === "home" ? (
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Choose what you want to do</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tile lets you sell products, create an artisan profile or open a premium shop.
              </p>
            </div>

            <div className="grid gap-4">
              <Button
                type="button"
                variant="outline"
                className="justify-start h-auto p-5 border-2 hover:border-accent/40 whitespace-normal"
                onClick={() => {
                  setMode("goods");
                  setStep(1);
                }}
              >
                <div className="text-left">
                  <h3 className="font-bold text-lg">🛒 Sell a Product</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Post phones, fashion, electronics, furniture, vehicles and more.
                  </p>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="justify-start h-auto p-5 border-2 hover:border-accent/40 whitespace-normal"
                onClick={() => nav({ to: "/artisan/create" })}
              >
                <div className="text-left">
                  <h3 className="font-bold text-lg">🧰 Join as an Artisan</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your professional profile and let customers find your services.
                  </p>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="justify-start h-auto p-5 border-2 hover:border-accent/40 whitespace-normal"
                onClick={() => nav({ to: "/open-shop" })}
              >
                <div className="text-left">
                  <h3 className="font-bold text-lg">🏬 Open a Shop</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upgrade to a premium storefront with your own branded shop page.
                  </p>
                </div>
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Step Progress indicators for internal Product wizard flow */}
            <div className="flex items-center gap-2 my-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`flex-1 h-2 rounded-full ${step >= s ? "bg-accent" : "bg-muted"}`} />
              ))}
            </div>

            <Card className="p-6">
              <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-5">
                {/* STEP 5 & 6: Wizard Renamed & explicit goods/services button block removed */}
                {step === 1 && (
                  <>
                    <h2 className="text-xl font-semibold">Choose Product Category</h2>
                    <p className="text-sm text-muted-foreground">
                      Select what you're selling. Choose the niche matching your listing layout description.
                    </p>

                    {/* STEP 7: Category filtering cleanly modified to only show 'goods' properties */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {CATEGORIES.filter((c) => c.type === "goods").map((c) => {
                        const isSelected = watch.category === c.slug;
                        return (
                          <button
                            key={c.slug}
                            type="button"
                            onClick={() => form.setValue("category", c.slug, { shouldValidate: true })}
                            className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between text-sm font-medium ${
                              isSelected
                                ? "border-accent bg-accent/10 text-foreground font-semibold"
                                : "border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <span className="truncate">{c.label}</span>
                            {isSelected && <Check className="h-4 w-4 text-accent shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>

                    {!watch.category && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium pt-1">
                        Select a specific category card before continuing.
                      </p>
                    )}

                    <div className="flex justify-between pt-4 border-t mt-4">
                      <Button type="button" variant="outline" onClick={() => setMode("home")}>
                        Cancel
                      </Button>
                      <Button type="button" disabled={!watch.category} onClick={nextStep}>
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}

                {/* STEP 5: Step 2 Flow */}
                {step === 2 && (
                  <>
                    <h2 className="text-xl font-semibold">Product Details</h2>
                    <div>
                      <Label>Title</Label>
                      <Input
                        {...form.register("title")}
                        placeholder="Samsung Galaxy S24 Ultra 256GB"
                      />
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        rows={5}
                        {...form.register("description")}
                        placeholder="Condition, specifications, warranty, reason for selling..."
                      />
                    </div>

                    <div>
                      <Label>Price (₦)</Label>
                      <Input type="number" {...form.register("price")} placeholder="50000" />
                    </div>

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

                    <div className="flex justify-between pt-4 border-t">
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

                {/* STEP 5: Step 3 Flow */}
                {step === 3 && (
                  <>
                    <h2 className="text-xl font-semibold">Location & Photos</h2>
                    <div className="space-y-5 border rounded-xl p-5 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">Location</h3>
                          <p className="text-sm text-muted-foreground">Select where this item is available.</p>
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
                        <Label>Local Government Area</Label>
                        <Select disabled={!watch.state_id} value={watch.lga_id} onValueChange={(v) => form.setValue("lga_id", v)}>
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

                    <div className="flex justify-between pt-4 border-t">
                      <Button type="button" variant="outline" onClick={prevStep}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      {/* STEP 13: Submitting button named explicitly for Admin review layout updates */}
                      <Button type="submit" disabled={submitting} className="bg-accent text-accent-foreground">
                        <Check className="h-4 w-4 mr-2" />
                        {submitting ? "Publishing..." : "Submit for Review"}
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
