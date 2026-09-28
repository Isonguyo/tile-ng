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
      const rows = (data ?? []) as Array<{ query?: string; term?: string; hits: number }>;
      return rows.map((r) => ({ term: r.term ?? r.query ?? "", hits: r.hits }));
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) supabase.rpc("log_search", { _q: term } as never).then(() => { });
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
      () => { },
      { timeout: 4000 },
    );
  };

  const chips = (trending.length ? trending.slice(0, 6).map((t) => t.term) : [
    "iPhone", "generator", "tailor", "mechanic", "laptop", "makeup artist",
  ]).filter(Boolean);

 return (
  <div className="w-full max-w-3xl mx-auto px-2 sm:px-0">
    <form
      onSubmit={submit}
      className="
        w-full
        rounded-2xl
        bg-background/95
        backdrop-blur
        border
        shadow-2xl
        p-1.5
        sm:p-2
        flex
        flex-col
        gap-1.5
        sm:flex-row
        sm:gap-2
      "
    >
      {/* Search input */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={ROTATING[placeholderIdx]}
          className="
            w-full
            h-9
            sm:h-10
            rounded-xl
            bg-transparent
            pl-9
            pr-3
            text-sm
            text-foreground
            placeholder:text-muted-foreground/70
            focus:outline-none
            truncate
          "
          aria-label="Search Tile"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Select value={loc} onValueChange={setLoc}>
          <SelectTrigger
            className="
              flex-1
              sm:flex-none
              w-auto
              sm:w-[150px]
              h-9
              sm:h-10
              rounded-xl
              text-white
              [&>span]:text-white
              min-w-0
            "
          >
            <SelectValue placeholder="All Nigeria" />
          </SelectTrigger>

          <SelectContent className="bg-background text-white">
            <SelectItem
              value="all"
              className="text-white focus:text-white data-[highlighted]:text-white"
            >
              All Nigeria
            </SelectItem>

            {LOCATIONS.map((l) => (
              <SelectItem
                key={l}
                value={l}
                className="text-white focus:text-white data-[highlighted]:text-white"
              >
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={useNearMe}
          className="
            h-9
            w-9
            sm:h-10
            sm:w-10
            rounded-xl
            shrink-0
            text-white
            border-white/50
            hover:text-white
            hover:border-white
          "
          title="Use my location"
        >
          <MapPin className="h-4 w-4 text-white" />
        </Button>

        <Button
          type="submit"
          className="
            h-9
            sm:h-10
            rounded-xl
            font-bold
            bg-accent
            hover:bg-accent/90
            text-accent-foreground
            px-4
            sm:px-6
            shrink-0
          "
        >
          <Search className="h-4 w-4 sm:hidden" />
          <span className="hidden sm:inline">Search</span>
        </Button>
      </div>
    </form>

    {chips.length > 0 && (
      <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2 justify-center">
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-primary-foreground/70 font-semibold flex items-center gap-1">
          <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          Trending
        </span>

        {chips.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => {
              setQ(term);
              nav({ to: "/", search: { q: term } });
            }}
            className="
              rounded-full
              bg-white/10
              hover:bg-white/20
              border
              border-white/15
              text-primary-foreground
              text-[10px]
              sm:text-xs
              font-medium
              px-2.5
              sm:px-3
              py-1
              transition-colors
            "
          >
            {term}
          </button>
        ))}
      </div>
    )}
  </div>
);
}
