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

export function HeroSearch({
  initialQ = "",
  initialLoc = "all",
}: {
  initialQ?: string;
  initialLoc?: string;
}) {
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
    if (term) supabase.rpc("log_search", { _q: term } as never).then(() => {});
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

  const chips = (
    trending.length
      ? trending.slice(0, 6).map((t) => t.term)
      : ["iPhone", "generator", "tailor", "mechanic", "laptop", "makeup artist"]
  ).filter(Boolean);

  return (
    <div className="tile-market-search w-full max-w-3xl min-w-0">
      <form
        onSubmit={submit}
        className="tile-market-search-form flex w-full min-w-0 flex-col gap-2 rounded-2xl border border-white/10 bg-background/95 p-2 shadow-2xl backdrop-blur sm:flex-row sm:items-center"
      >
        <div className="tile-market-search-input relative min-w-0 flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ROTATING[placeholderIdx]}
            aria-label="Search Tile"
            className="h-12 w-full min-w-0 rounded-xl border-0 bg-transparent pl-10 pr-2 text-sm text-white shadow-none placeholder:text-slate-400 focus:outline-none sm:pr-3"
          />
        </div>

        <div className="tile-market-search-actions grid min-w-0 grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <Select value={loc} onValueChange={setLoc}>
            <SelectTrigger className="tile-market-search-location h-12 w-full min-w-0 flex-1 rounded-xl border-white/10 bg-white/5 px-3 text-sm text-white [&>span]:text-white sm:w-[150px] sm:flex-none">
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
            title="Use my location"
            className="tile-market-search-near hidden h-12 w-12 shrink-0 rounded-xl border-white/20 bg-white/5 text-white hover:border-white/30 hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            <MapPin className="h-4 w-4 text-emerald-300" />
          </Button>

          <Button
            type="submit"
            className="tile-market-search-submit h-12 min-w-0 flex-1 rounded-xl bg-[#35d879] px-4 font-bold text-[#04120a] hover:bg-[#52e98f] sm:flex-none sm:px-6"
          >
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </form>

      {chips.length > 0 && (
        <div className="tile-market-search-trending mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:mt-4 sm:gap-2">
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
