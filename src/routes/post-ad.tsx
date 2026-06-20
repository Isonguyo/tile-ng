import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Upload, X, ChevronRight, ChevronLeft, Check } from "lucide-react";

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
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { type: "goods", category: "" },
  });
  const watch = form.watch();

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
      toast.error(`Error on validation parameter: ${errors[first]?.message || first}`);
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
                      <Select value={field.value} onValueChange={field.onChange}>
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
                  <Input type="number" {...form.register("price")} />
                </div>
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
                  <Button type="button" onClick={async () => {
                    const valid = await form.trigger(["title", "description", "price"]);
                    if (valid) setStep(3);
                  }}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-xl font-semibold">Step 3 — Media & Location Hierarchy</h2>
                
                {/* Geolocation Selectors Block */}
                <div className="space-y-4 border p-4 rounded-xl bg-muted/20">
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
                          <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
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
                          <SelectTrigger><SelectValue placeholder="Select City" /></SelectTrigger>
                          <SelectContent>
                            {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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
                          <SelectTrigger><SelectValue placeholder="Select LGA" /></SelectTrigger>
                          <SelectContent>
                            {lgas.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <Label>Contact Phone Number</Label>
                  <Input {...form.register("phone")} placeholder="080XXXXXXXX" />
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
                  <Button type="submit" disabled={submitting} className="bg-accent text-accent-foreground">
                    <Check className="h-4 w-4 mr-1" />{submitting ? "Posting..." : "Publish Advertisement"}
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
