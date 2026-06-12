import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, LOCATIONS } from "@/lib/categories";
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
  location: z.string().min(1),
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
    defaultValues: { type: "goods" },
  });
  const watch = form.watch();

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
      let imagePaths: string[] = [];
      if (files.length) imagePaths = await uploadListingImages(user.id, files);
      const { data, error } = await supabase.from("listings").insert({
        user_id: user.id,
        type: vals.type,
        category: vals.category,
        title: vals.title,
        description: vals.description,
        location: vals.location,
        phone: vals.phone,
        price: vals.price ?? null,
        condition: vals.type === "goods" ? vals.condition : null,
        brand: vals.type === "goods" ? vals.brand : null,
        years_experience: vals.type === "service" ? vals.years_experience : null,
        service_mode: vals.type === "service" ? vals.service_mode : null,
        images: imagePaths,
      }).select().single();
      if (error) throw error;
      toast.success("Ad submitted for review");
      nav({ to: "/listing/$id", params: { id: data.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post");
    } finally { setSubmitting(false); }
  };

  const filtered = CATEGORIES.filter((c) => c.type === watch.type);

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                  <Select value={watch.category} onValueChange={(v) => form.setValue("category", v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Pick one…" /></SelectTrigger>
                    <SelectContent>
                      {filtered.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && <p className="text-sm text-destructive mt-1">{form.formState.errors.category.message}</p>}
                </div>
                <div className="flex justify-end">
                  <Button type="button" onClick={() => watch.category && setStep(2)}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-xl font-semibold">Step 2 — Details</h2>
                <div><Label>Title</Label><Input {...form.register("title")} placeholder="e.g. iPhone 14 Pro Max — clean" />
                  {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}</div>
                <div><Label>Description</Label><Textarea {...form.register("description")} rows={5} /></div>

                {watch.type === "goods" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Price (₦)</Label><Input type="number" {...form.register("price")} /></div>
                    <div><Label>Brand</Label><Input {...form.register("brand")} /></div>
                    <div className="col-span-2"><Label>Condition</Label>
                      <Select value={watch.condition} onValueChange={(v) => form.setValue("condition", v as never)}>
                        <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Brand new</SelectItem>
                          <SelectItem value="used_like_new">Used — like new</SelectItem>
                          <SelectItem value="used_good">Used — good</SelectItem>
                          <SelectItem value="used_fair">Used — fair</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Starting price (₦)</Label><Input type="number" {...form.register("price")} /></div>
                    <div><Label>Years of experience</Label><Input type="number" {...form.register("years_experience")} /></div>
                    <div className="col-span-2"><Label>Service type</Label>
                      <Select value={watch.service_mode} onValueChange={(v) => form.setValue("service_mode", v as never)}>
                        <SelectTrigger><SelectValue placeholder="How is it delivered?" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="in_person">In-person</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
                  <Button type="button" onClick={() => setStep(3)}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-xl font-semibold">Step 3 — Media & contact</h2>
                <div>
                  <Label>{watch.type === "service" ? "Portfolio images" : "Item photos"}</Label>
                  <label className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-accent">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground mt-2">Click or drag to upload (up to 6)</span>
                    <input type="file" multiple accept="image/*" className="hidden"
                      onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 6))} />
                  </label>
                  {files.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {files.map((f, i) => (
                        <div key={i} className="relative aspect-square rounded overflow-hidden border">
                          <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Location</Label>
                    <Select value={watch.location} onValueChange={(v) => form.setValue("location", v, { shouldValidate: true })}>
                      <SelectTrigger><SelectValue placeholder="City" /></SelectTrigger>
                      <SelectContent>{LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Phone</Label><Input {...form.register("phone")} placeholder="0801…" /></div>
                </div>
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
                  <Button type="submit" disabled={submitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Check className="h-4 w-4 mr-1" />{submitting ? "Posting…" : "Submit for review"}
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