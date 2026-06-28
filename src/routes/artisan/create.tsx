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

          {/* Content goes here */}

        </Card>

      </div>

    </div>
  );
}
