import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LOCATIONS } from "@/lib/categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROTATING = [
  "Try 'iPhone 15 in Lagos'",
  "Search 'plumber near me'",
  "Find 'hair stylist in Abuja'",
  "Discover 'toyota corolla 2018'",
  "Hire 'wedding photographer'",
  "Shop 'ankara fabric wholesale'",
  "Book 'ac technician Port Harcourt'",
];

export function HeroSearch({ initialQ = "", initialLoc = "all" }: { initialQ?: string; initialLoc?: string }) {
  const nav = useNavigate({ from: "/" });
  const [q, setQ] = useState(initialQ);
  const [loc, setLoc] = useState(initialLoc);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx((i) => (i + 1) % ROTATING.length), 2600);
    return () => clearInterval(t);
  }, []);

  const { data: trending = [] } = useQuery({
    queryKey: ["trending-searches"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("trending_searches");
      if (error) return [] as Array<{ term: string; hits: number }>;
      return (data as Array<{ term: string; hits: number }>) ?? [];
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) supabase.rpc("log_search", { p_term: term }).then(() => {});
    nav({
      to: "/",
      search: {
        q: term || undefined,
        loc: loc !== "all" ? loc : undefined,
      },
    });
  };

  const useNearMe = () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      () => {
        // We don't reverse-geocode client-side; hint the user to pick their state
        // and sort listings by their state going forward.
        setLoc((prev) => (prev === "all" ? "Lagos" : prev));
      },
      () => {},
      { timeout: 4000 },
    );
  };

  const chips = (trending.length ? trending.slice(0, 6).map((t) => t.term) : [
    "iPhone", "generator", "tailor", "mechanic", "laptop", "makeup artist",
  ]).filter(Boolean);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form
        onSubmit={submit}
        className="flex flex-col sm:flex-row gap-2 rounded-2xl bg-background/95 backdrop-blur border shadow-2xl p-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ROTATING[placeholderIdx]}
            className="w-full h-10 rounded-xl bg-transparent pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none"
            aria-label="Search Tile"
          />
        </div>
        <div className="flex gap-2">
          <Select value={loc} onValueChange={setLoc}>
            <SelectTrigger className="w-[150px] h-10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Nigeria</SelectItem>
              {LOCATIONS.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={useNearMe}
            className="h-10 w-10 rounded-xl shrink-0"
            title="Use my location"
          >
            <MapPin className="h-4 w-4" />
          </Button>
          <Button type="submit" className="h-10 rounded-xl font-bold bg-accent hover:bg-accent/90 text-accent-foreground px-6">
            Search
          </Button>
        </div>
      </form>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 justify-center">
          <span className="text-xs uppercase tracking-wider text-primary-foreground/70 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> Trending
          </span>
          {chips.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setQ(term);
                nav({ to: "/", search: { q: term } });
              }}
              className="rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-primary-foreground text-xs font-medium px-3 py-1 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}