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

  years_experience: z.coerce
    .number()
    .min(0)
    .max(80),

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
    const { data: states = [] } = useQuery({
    queryKey: ["artisan-states"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("states")
        .select("name")
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
    if (!loading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />

        <div className="container mx-auto max-w-xl px-4 py-24 text-center">

          <h1 className="text-3xl font-bold">
            Become a Tile Artisan
          </h1>

          <p className="mt-4 text-muted-foreground">
            Create your professional profile so customers can discover
            and contact you anywhere in Nigeria.
          </p>

          <Button asChild className="mt-8">
            <Link to="/auth">
              Sign in to continue
            </Link>
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

          <h1 className="text-4xl font-bold">
            Become a Tile Artisan
          </h1>

          <p className="mt-3 text-muted-foreground">
            Build your professional profile and start getting discovered
            by customers looking for trusted artisans.
          </p>

        </div>

       <Card className="overflow-hidden">

  {step === 1 && (

    <div className="p-8">

      <div className="text-center">

        <div className="text-6xl mb-5">
          👷
        </div>

        <h2 className="text-3xl font-bold">
          Become a Tile Artisan
        </h2>

        <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
          Create your professional profile so customers across Nigeria can
          discover your skills, view your previous work and contact you
          directly.
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

        <h3 className="font-semibold mb-4">
          How it works
        </h3>

        <div className="space-y-3">

          <p>1️⃣ Create your artisan profile</p>

          <p>2️⃣ Upload your portfolio</p>

          <p>3️⃣ Customers contact you directly</p>

        </div>

      </div>

      <Button
        className="w-full mt-10"
        size="lg"
        onClick={() => setStep(2)}
      >
        Create My Profile
        <ChevronRight className="ml-2 h-5 w-5" />
      </Button>

    </div>

  )}

  {step === 2 && (

<div className="p-8 space-y-6">

<div>

<h2 className="text-2xl font-bold">
Basic Information
</h2>

<p className="text-muted-foreground mt-2">
Tell customers who you are and what you do.
</p>

</div>

<div>

<Label>Full Name</Label>

<Input
placeholder="John Doe"
{...form.register("full_name")}
/>

</div>

<div>

<Label>Profession</Label>

<Select
value={watch.profession}
onValueChange={(value)=>
form.setValue("profession", value)
}
>

<SelectTrigger>

<SelectValue placeholder="Select your profession" />

</SelectTrigger>

<SelectContent>

{ARTISAN_CATEGORIES.map((category)=>(
<SelectItem
key={category.id}
value={category.label}
>

{category.icon} {category.label}

</SelectItem>
))}

</SelectContent>

</Select>

</div>

<div>

<Label>Phone Number</Label>

<Input
placeholder="08012345678"
{...form.register("phone")}
/>

</div>

<div>

<Label>WhatsApp Number (Optional)</Label>

<Input
placeholder="08012345678"
{...form.register("whatsapp")}
/>

</div>

<div>

<Label>State</Label>

<Select
value={watch.state}
onValueChange={(value)=>{

form.setValue("state", value);

form.setValue("lga","");

}}
>

<SelectTrigger>

<SelectValue placeholder="Select State" />

</SelectTrigger>

<SelectContent>

{states.map((state)=>(
<SelectItem
key={state.id}
value={state.id}
>

{state.name}

</SelectItem>
))}

</SelectContent>

</Select>

</div>

<div>

<Label>Local Government Area</Label>

<Select
disabled={!watch.state}
value={watch.lga}
onValueChange={(value)=>
form.setValue("lga",value)
}
>

<SelectTrigger>

<SelectValue placeholder="Select Local Government" />

</SelectTrigger>

<SelectContent>

{lgas.map((lga)=>(
<SelectItem
key={lga.id}
value={lga.id}
>

{lga.name}

</SelectItem>
))}

</SelectContent>

</Select>

</div>

<div>

<Label>Years of Experience</Label>

<Input
type="number"
placeholder="5"
{...form.register("years_experience")}
/>

</div>

<div>

<Label>Professional Bio</Label>

<Textarea
rows={6}
placeholder="Tell customers about yourself, your experience, the services you provide and why they should hire you..."
{...form.register("bio")}
/>

</div>

<div className="flex justify-between pt-4">

<Button
variant="outline"
onClick={()=>setStep(1)}
type="button"
>

<ChevronLeft className="mr-2 h-4 w-4"/>

Back

</Button>

<Button
type="button"
onClick={()=>setStep(3)}
>

Continue

<ChevronRight className="ml-2 h-4 w-4"/>

</Button>

</div>

</div>

)}

</Card>

      </div>

    </div>
  );
}
