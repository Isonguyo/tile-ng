import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Rocket, BadgeCheck, Store, Wrench, Gift, ShoppingBag, Users, MessageSquare,
  ShieldCheck, Megaphone, Search, Sparkles, ArrowRight, CheckCircle2, Loader2,
  Facebook, Instagram, Linkedin, Youtube, Music2, Twitter, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { LOCATIONS } from "@/lib/categories";
import { LAUNCH_PROGRESS } from "@/lib/launch-config";

const TITLE = "Tile Marketplace | Join the Waitlist";
const DESCRIPTION =
  "Tile connects buyers, sellers and skilled artisans across Nigeria in one trusted marketplace. Join the waitlist and be first in line at launch.";
const URL = "https://tile-ng.lovable.app/wait-list";
const IMAGE = "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg";

export const Route = createFileRoute("/wait-list")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { property: "og:image", content: IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: IMAGE },
    ],
    links: [
      {
        rel: "icon",
        href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg",
      },
      {
        rel: "canonical",
        href: URL,
      },
    ],
  }),
  component: WaitListPage,
});

const BENEFITS = [
  { icon: Rocket, title: "Early Access", body: "Be among the very first people to use Tile when we open the doors." },
  { icon: BadgeCheck, title: "Priority Verification", body: "Get your account verified faster, before the public rush." },
  { icon: Store, title: "Seller Advantage", body: "Build and stock your shop before everyone else joins." },
  { icon: Wrench, title: "Artisan Exposure", body: "Get discovered by paying customers from day one." },
  { icon: Gift, title: "Launch Rewards", body: "Exclusive launch bonuses and free promotional slots." },
];

const FEATURES = [
  { icon: ShoppingBag, title: "Buy & Sell Products", body: "List anything from phones to property in minutes." },
  { icon: Wrench, title: "Find Trusted Artisans", body: "Plumbers, tailors, electricians and more, near you." },
  { icon: MessageSquare, title: "Secure Messaging", body: "Chat with buyers and sellers without sharing your number." },
  { icon: ShieldCheck, title: "Verified Vendors", body: "KYC-backed badges so you know who you're dealing with." },
  { icon: Store, title: "Business Shops", body: "A shareable storefront with your own link and QR code." },
  { icon: Megaphone, title: "Promotions", body: "Boost listings to the top of search and category pages." },
  { icon: Search, title: "Smart Search", body: "Filter by state, LGA, price, condition and rating." },
  { icon: Sparkles, title: "AI Recommendations", body: "Personalised picks tailored to you.", soon: true },
];

const FAQS = [
  { q: "When is Tile launching?", a: "We're in the final stretch of development. Waitlist members get the launch date by email before anyone else." },
  { q: "Is joining free?", a: "Yes. Joining the waitlist is completely free, and there's no obligation to buy or sell anything." },
  { q: "Can artisans register?", a: "Absolutely. Artisans get a dedicated profile with portfolio, ratings and direct customer enquiries. Choose 'Artisan' when joining." },
  { q: "Can businesses use Tile?", a: "Yes. Businesses can open a verified shop with their own storefront link, QR code, analytics and promotion tools." },
  { q: "How will I know when it launches?", a: "We'll email you the moment we go live, along with your early-access invitation and launch bonuses." },
];

const SOCIALS = [
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Music2, label: "TikTok", href: "#" },
  { icon: Twitter, label: "X", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
  { icon: Youtube, label: "YouTube", href: "#" },
  { icon: MessageCircle, label: "WhatsApp Community (Coming Soon)", href: "#", soon: true },
];

function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let frame = 0;
    const total = 40;
    const id = setInterval(() => {
      frame += 1;
      setValue(Math.round((target * frame) / total));
      if (frame >= total) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [target]);
  return value;
}

function WaitListPage() {
  const qc = useQueryClient();
  const formRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState<null | "joined" | "exists">(null);

  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", state: "", city: "",
    user_type: "buyer", referral_code: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: count = 0 } = useQuery({
    queryKey: ["waitlist-count"],
    queryFn: async () => {
      const { data } = await supabase.rpc("waitlist_count");
      return Number(data ?? 0);
    },
  });
  const animated = useCountUp(count);

  useEffect(() => {
    void supabase.rpc("track_waitlist_event", { _event_type: "visit" });
  }, []);

  const scrollToForm = () => {
    void supabase.rpc("track_waitlist_event", { _event_type: "join_click" });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const join = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("join_waitlist", {
        _full_name: form.full_name,
        _email: form.email,
        _phone: form.phone || undefined,
        _state: form.state || undefined,
        _city: form.city || undefined,
        _user_type: form.user_type,
        _referral_code: form.referral_code || undefined,
        _source: "wait-list",
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (result) => {
      if (result === "invalid_email") {
        setErrors({ email: "Enter a valid email address" });
        return;
      }
      if (result === "invalid_name") {
        setErrors({ full_name: "Enter your full name" });
        return;
      }
      if (result === "exists") {
        setDone("exists");
        toast.success("You're already on the waitlist 🎉");
        return;
      }
      setDone("joined");
      toast.success("You're in! We'll email you before launch 🎉");
      void qc.invalidateQueries({ queryKey: ["waitlist-count"] });
    },
    onError: (e: Error) => toast.error(e.message || "Something went wrong. Please try again."),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.full_name.trim().length < 2) next.full_name = "Enter your full name";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) next.email = "Enter a valid email address";
    setErrors(next);
    if (Object.keys(next).length) return;
    join.mutate();
  };

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-105">
            <img
              src="https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg"
              alt="Tile Logo"
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>
            <span className="text-lg font-black tracking-tight">Tile</span>
          </div>
          <Button size="sm" onClick={scrollToForm}>Join the Waitlist</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,hsl(var(--primary)/0.22),transparent_45%),radial-gradient(circle_at_85%_10%,hsl(var(--primary)/0.12),transparent_40%)]" />
        <div className="container relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <Badge variant="secondary" className="mb-6 animate-in fade-in slide-in-from-bottom-2 rounded-full px-3 py-1">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Launching soon in Nigeria
          </Badge>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight animate-in fade-in slide-in-from-bottom-3 duration-700 sm:text-6xl lg:text-7xl">
            Buy. Sell. Hire.
            <span className="mt-2 block bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              Everything you need in one trusted marketplace.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground animate-in fade-in duration-1000 sm:text-lg">
            Tile connects buyers, sellers and skilled artisans across Nigeria in one powerful platform.
            Join the waitlist today and be among the first to experience the future of local commerce.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="h-12 px-8 text-base" onClick={scrollToForm}>
              Join the Waitlist <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <a href="#why-join">Learn More</a>
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-primary/20" />
              ))}
            </div>
            <span>
              Join <span className="font-bold text-foreground">{animated.toLocaleString()}</span> early members preparing for launch
            </span>
          </div>
        </div>
      </section>

      {/* Form */}
      <section ref={formRef} id="join" className="container mx-auto max-w-3xl px-4 pb-20">
        <Card className="border-border/70 p-6 shadow-2xl shadow-primary/10 sm:p-8">
          {done ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
              <h2 className="mt-4 text-2xl font-black">
                {done === "exists" ? "You're already on the waitlist 🎉" : "You're on the list 🎉"}
              </h2>
              <p className="mt-2 text-muted-foreground">
                We'll email you the moment Tile goes live, with your early-access invite.
              </p>
              <Button variant="outline" className="mt-6" onClick={() => setDone(null)}>
                Add another person
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Join the waitlist</h2>
                <p className="mt-1 text-sm text-muted-foreground">Takes 20 seconds. No payment needed.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input id="full_name" value={form.full_name} maxLength={120}
                    onChange={(e) => set("full_name")(e.target.value)} placeholder="Chidi Okafor" />
                  {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" value={form.email} maxLength={255}
                    onChange={(e) => set("email")(e.target.value)} placeholder="you@example.com" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number <span className="text-muted-foreground">(optional)</span></Label>
                  <Input id="phone" value={form.phone} maxLength={30}
                    onChange={(e) => set("phone")(e.target.value)} placeholder="0803 000 0000" />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={form.state} onValueChange={set("state")}>
                    <SelectTrigger><SelectValue placeholder="Select your state" /></SelectTrigger>
                    <SelectContent className="max-h-64">
                      {LOCATIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={form.city} maxLength={60}
                    onChange={(e) => set("city")(e.target.value)} placeholder="Ikeja" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referral">Referral code <span className="text-muted-foreground">(optional)</span></Label>
                  <Input id="referral" value={form.referral_code} maxLength={40}
                    onChange={(e) => set("referral_code")(e.target.value)} placeholder="TILE-XXXX" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>I'm joining as</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { v: "buyer", l: "Buyer" },
                    { v: "seller", l: "Seller" },
                    { v: "artisan", l: "Artisan" },
                    { v: "all", l: "All of the above" },
                  ].map((o) => (
                    <button key={o.v} type="button" onClick={() => set("user_type")(o.v)}
                      className={`rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${form.user_type === o.v
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted"
                        }`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={join.isPending}>
                {join.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining…</> : "Join the Waitlist"}
              </Button>
            </form>
          )}
        </Card>
      </section>

      {/* Why join */}
      <section id="why-join" className="border-t border-border/60 bg-muted/20 py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Why join early?</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">Early members get advantages the public launch won't offer.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <Card key={b.title} className="group border-border/70 p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold">{b.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Everything Tile will do</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">One platform for goods, services and the people behind them.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card key={f.title} className="border-border/70 p-5 transition-colors hover:border-primary/50">
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 flex items-center gap-2 font-bold">
                  {f.title}
                  {f.soon && <Badge variant="secondary" className="text-[10px]">Soon</Badge>}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Launch progress */}
      <section className="border-y border-border/60 bg-muted/20 py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Launch progress</h2>
          <div className="mt-8 rounded-2xl border border-border/70 bg-background p-6 sm:p-8">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Platform development</span>
              <span className="text-primary">{LAUNCH_PROGRESS.overall}%</span>
            </div>
            <Progress value={LAUNCH_PROGRESS.overall} className="mt-3 h-3" />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {LAUNCH_PROGRESS.milestones.map((m) => (
                <div key={m.label} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                  <span className="font-medium">{m.label}</span>
                  <Badge variant={m.status === "Completed" ? "default" : m.status === "In Progress" ? "secondary" : "outline"}>
                    {m.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="mt-8">
            {FAQS.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border/60 bg-gradient-to-b from-primary/10 to-transparent py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <Users className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
            Ready to join Nigeria's next marketplace?
          </h2>
          <p className="mt-3 text-muted-foreground">Join the waitlist today — it's free, and it takes 20 seconds.</p>
          <Button size="lg" className="mt-8 h-14 px-10 text-base" onClick={scrollToForm}>
            Join the Waitlist <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10">
        <div className="container mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} aria-label={s.label}
                className={`grid h-10 w-10 place-items-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary ${s.soon ? "opacity-50" : ""}`}>
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Tile. Nigeria's marketplace for buying, selling and hiring artisans.
          </p>
        </div>
      </footer>
    </div>
  );
}
