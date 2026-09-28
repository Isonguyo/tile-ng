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
    flex items-center
    gap-1.5
    rounded-2xl
    border
    border-white/10
    bg-background/95
    p-1.5
    shadow-2xl
    backdrop-blur
    sm:gap-2
    sm:p-2
  "
>
  {/* Search input */}
  <div className="relative min-w-0 flex-1">
    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300" />

    <input
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder={ROTATING[placeholderIdx]}
      aria-label="Search Tile"
      className="
        h-10
        w-full
        min-w-0
        rounded-xl
        border-0
        bg-transparent
        pl-10
        pr-2
        text-sm
        text-white
        shadow-none
        placeholder:text-slate-400
        focus:outline-none
        sm:h-12
        sm:pr-3
      "
    />
  </div>

  {/* Location */}
  <Select value={loc} onValueChange={setLoc}>
    <SelectTrigger
      className="
        h-10
        w-[82px]
        shrink-0
        rounded-xl
        border-white/10
        bg-white/5
        px-2
        text-xs
        text-white
        [&>span]:text-white
        sm:h-12
        sm:w-[150px]
        sm:px-3
        sm:text-sm
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

  {/* Near me */}
  <Button
    type="button"
    variant="outline"
    size="icon"
    onClick={useNearMe}
    title="Use my location"
    className="
      h-10
      w-10
      shrink-0
      rounded-xl
      border-white/20
      bg-white/5
      text-white
      hover:border-white/30
      hover:bg-white/10
      hover:text-white
      sm:h-12
      sm:w-12
    "
  >
    <MapPin className="h-4 w-4 text-emerald-300" />
  </Button>

  {/* Search */}
  <Button
    type="submit"
    className="
      h-10
      w-10
      shrink-0
      rounded-xl
      bg-[#35d879]
      px-0
      font-bold
      text-[#04120a]
      hover:bg-[#52e98f]
      sm:h-12
      sm:w-auto
      sm:px-6
    "
    aria-label="Search"
  >
    <Search className="h-4 w-4 sm:hidden" />
    <span className="hidden sm:inline">
      Search
    </span>
  </Button>
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
