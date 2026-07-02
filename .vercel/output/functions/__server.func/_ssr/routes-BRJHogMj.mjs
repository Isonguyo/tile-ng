import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-B0U85Udx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-DRsC1qZi.mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as Package, B as LayoutGrid, C as Search, J as Flame, P as MapPin, c as UserRound, f as Tag, ht as BadgeCheck, i as Wrench, it as ChevronRight, p as Store, t as lucide_react_exports, u as TrendingUp, vt as ArrowRight, w as SearchX, xt as Activity } from "../_libs/lucide-react.mjs";
import { t as SiteHeader } from "./site-header-Cke-4LQf.mjs";
import { t as Card } from "./card-BLWafi8D.mjs";
import { t as Badge } from "./badge-Cc0IblCb.mjs";
import { i as TabsTrigger, r as TabsList, t as Tabs } from "./tabs-BYfOmXtJ.mjs";
import { n as LOCATIONS, t as CATEGORIES } from "./categories-j3aLXACs.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DUy71i1r.mjs";
import { t as Route } from "./routes-KHDnuILI.mjs";
import { t as ListingCard } from "./listing-card-BaKCvctb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BRJHogMj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ROTATING = [
	"Try 'iPhone 15 in Lagos'",
	"Search 'plumber near me'",
	"Find 'hair stylist in Abuja'",
	"Discover 'toyota corolla 2018'",
	"Hire 'wedding photographer'",
	"Shop 'ankara fabric wholesale'",
	"Book 'ac technician Port Harcourt'"
];
function HeroSearch({ initialQ = "", initialLoc = "all" }) {
	const nav = useNavigate({ from: "/" });
	const [q, setQ] = (0, import_react.useState)(initialQ);
	const [loc, setLoc] = (0, import_react.useState)(initialLoc);
	const [placeholderIdx, setPlaceholderIdx] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const t = setInterval(() => setPlaceholderIdx((i) => (i + 1) % ROTATING.length), 2600);
		return () => clearInterval(t);
	}, []);
	const { data: trending = [] } = useQuery({
		queryKey: ["trending-searches"],
		staleTime: 6e4,
		queryFn: async () => {
			const { data, error } = await supabase.rpc("trending_searches");
			if (error) return [];
			return (data ?? []).map((r) => ({
				term: r.term ?? r.query ?? "",
				hits: r.hits
			}));
		}
	});
	const submit = (e) => {
		e.preventDefault();
		const term = q.trim();
		if (term) supabase.rpc("log_search", { _q: term }).then(() => {});
		nav({
			to: "/",
			search: {
				q: term || void 0,
				loc: loc !== "all" ? loc : void 0
			}
		});
	};
	const useNearMe = () => {
		if (!("geolocation" in navigator)) return;
		navigator.geolocation.getCurrentPosition(() => {
			setLoc((prev) => prev === "all" ? "Lagos" : prev);
		}, () => {}, { timeout: 4e3 });
	};
	const chips = (trending.length ? trending.slice(0, 6).map((t) => t.term) : [
		"iPhone",
		"generator",
		"tailor",
		"mechanic",
		"laptop",
		"makeup artist"
	]).filter(Boolean);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full max-w-3xl mx-auto",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: submit,
			className: "flex flex-col sm:flex-row gap-2 rounded-2xl bg-background/95 backdrop-blur border shadow-2xl p-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: ROTATING[placeholderIdx],
					className: "w-full h-10 rounded-xl bg-transparent pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none",
					"aria-label": "Search Tile"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: loc,
						onValueChange: setLoc,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "w-[150px] h-10 rounded-xl",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "All Nigeria"
						}), LOCATIONS.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: l,
							children: l
						}, l))] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						size: "icon",
						onClick: useNearMe,
						className: "h-10 w-10 rounded-xl shrink-0",
						title: "Use my location",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-4 w-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "h-10 rounded-xl font-bold bg-accent hover:bg-accent/90 text-accent-foreground px-6",
						children: "Search"
					})
				]
			})]
		}), chips.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-wrap items-center gap-2 justify-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-xs uppercase tracking-wider text-primary-foreground/70 font-semibold flex items-center gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "h-3.5 w-3.5" }), " Trending"]
			}), chips.map((term) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => {
					setQ(term);
					nav({
						to: "/",
						search: { q: term }
					});
				},
				className: "rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-primary-foreground text-xs font-medium px-3 py-1 transition-colors",
				children: term
			}, term))]
		})]
	});
}
function ago(ts) {
	const s = Math.max(1, Math.floor((Date.now() - ts) / 1e3));
	if (s < 60) return `${s}s ago`;
	const m = Math.floor(s / 60);
	if (m < 60) return `${m}m ago`;
	return `${Math.floor(m / 60)}h ago`;
}
/**
* Rolling ticker of the newest approved listings and shops, refreshed from
* a one-time backfill plus a realtime subscription.
*/
function LiveActivityFeed() {
	const [events, setEvents] = (0, import_react.useState)([]);
	const [, force] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		let alive = true;
		(async () => {
			const [{ data: listings }, { data: shops }] = await Promise.all([supabase.from("listings").select("id, title, location, created_at").eq("status", "approved").order("created_at", { ascending: false }).limit(6), supabase.from("shops").select("id, business_name, location, created_at").order("created_at", { ascending: false }).limit(4)]);
			if (!alive) return;
			setEvents([...(listings ?? []).map((l) => ({
				id: `l:${l.id}`,
				kind: "listing",
				text: `New listing · ${l.title}${l.location ? ` · ${l.location}` : ""}`,
				at: new Date(l.created_at).getTime()
			})), ...(shops ?? []).map((s) => ({
				id: `s:${s.id}`,
				kind: "shop",
				text: `Shop opened · ${s.business_name ?? "New shop"}${s.location ? ` · ${s.location}` : ""}`,
				at: new Date(s.created_at).getTime()
			}))].sort((a, b) => b.at - a.at).slice(0, 10));
		})();
		const channel = supabase.channel("home-live-activity").on("postgres_changes", {
			event: "INSERT",
			schema: "public",
			table: "listings"
		}, (payload) => {
			const l = payload.new;
			if (l.status && l.status !== "approved") return;
			setEvents((prev) => [{
				id: `l:${l.id}`,
				kind: "listing",
				text: `New listing · ${l.title ?? "Item"}${l.location ? ` · ${l.location}` : ""}`,
				at: Date.now()
			}, ...prev].slice(0, 10));
		}).subscribe();
		const tick = setInterval(() => force((n) => n + 1), 3e4);
		return () => {
			alive = false;
			supabase.removeChannel(channel);
			clearInterval(tick);
		};
	}, []);
	if (!events.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border bg-background/60 backdrop-blur p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 mb-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "relative flex h-2 w-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-emerald-500" })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
				className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "h-3.5 w-3.5" }), " Live on Tile right now"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "space-y-2 max-h-52 overflow-hidden",
			children: events.map((e) => {
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1 duration-500",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-7 w-7 rounded-lg bg-primary/10 grid place-items-center shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(e.kind === "listing" ? Package : Store, { className: "h-3.5 w-3.5 text-primary" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex-1 min-w-0 truncate text-foreground/90",
							children: e.text
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground shrink-0 font-mono",
							children: ago(e.at)
						})
					]
				}, e.id);
			})
		})]
	});
}
/**
* Count-up animation that runs once when the target value first becomes truthy,
* and re-runs whenever the target changes by a meaningful amount.
*/
function AnimatedCounter({ value, duration = 1200, className }) {
	const [display, setDisplay] = (0, import_react.useState)(0);
	const raf = (0, import_react.useRef)(null);
	const from = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		if (!Number.isFinite(value)) return;
		const start = performance.now();
		const startVal = from.current;
		const delta = value - startVal;
		const tick = (now) => {
			const t = Math.min(1, (now - start) / duration);
			const eased = 1 - Math.pow(1 - t, 3);
			setDisplay(Math.round(startVal + delta * eased));
			if (t < 1) raf.current = requestAnimationFrame(tick);
			else from.current = value;
		};
		raf.current = requestAnimationFrame(tick);
		return () => {
			if (raf.current) cancelAnimationFrame(raf.current);
		};
	}, [value, duration]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className,
		children: display.toLocaleString()
	});
}
var POPULAR_SERVICES = [
	{
		label: "Electricians",
		slug: "electrician",
		icon: "Plug"
	},
	{
		label: "Plumbers",
		slug: "plumber",
		icon: "Droplet"
	},
	{
		label: "Mechanics",
		slug: "mechanic",
		icon: "Wrench"
	},
	{
		label: "Cleaners",
		slug: "cleaner",
		icon: "Sparkles"
	},
	{
		label: "Painters",
		slug: "painter",
		icon: "Paintbrush"
	},
	{
		label: "Carpenters",
		slug: "carpenter",
		icon: "Hammer"
	},
	{
		label: "Hair Stylists",
		slug: "hair-stylist",
		icon: "Scissors"
	},
	{
		label: "Photographers",
		slug: "photographer",
		icon: "Camera"
	},
	{
		label: "Fashion Designers",
		slug: "fashion-designer",
		icon: "Shirt"
	},
	{
		label: "Web Developers",
		slug: "web-developer",
		icon: "Laptop"
	}
];
function Index() {
	const navigate = useNavigate({ from: "/" });
	const { q, loc, cat } = Route.useSearch();
	const listingsRef = (0, import_react.useRef)(null);
	const isFiltering = Boolean(q) || Boolean(cat) || loc && loc !== "all";
	const [searchInput, setSearchInput] = (0, import_react.useState)(q ?? "");
	const [selectedLocation, setSelectedLocation] = (0, import_react.useState)(loc ?? "all");
	const [activeTab, setActiveTab] = (0, import_react.useState)("all");
	const [sortBy, setSortBy] = (0, import_react.useState)("newest");
	(0, import_react.useEffect)(() => {
		if (!isFiltering) return;
		listingsRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start"
		});
	}, [
		q,
		cat,
		loc,
		isFiltering
	]);
	(0, import_react.useEffect)(() => {
		setSearchInput(q ?? "");
		setSelectedLocation(loc ?? "all");
	}, [q, loc]);
	const { data: listings = [], isLoading } = useQuery({
		queryKey: ["listings", {
			q,
			loc,
			cat
		}],
		queryFn: async () => {
			let query = supabase.from("listings").select(`
          id, title, price, type, category, description, location, images, is_promoted, views_count, clicks_count, user_id, created_at
        `).eq("status", "approved").limit(150);
			if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
			if (loc && loc !== "all") query = query.eq("location", loc);
			if (cat) query = query.eq("category", cat);
			const { data, error } = await query;
			if (error) throw error;
			const rows = data || [];
			const userIds = [...new Set(rows.map((r) => r.user_id))];
			if (!userIds.length) return rows;
			const { data: profiles } = await supabase.from("public_profiles").select(`id, subscription_tier, is_verified, business_name, avatar_url, shop_slug`).in("id", userIds);
			const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
			return rows.map((listing) => ({
				...listing,
				seller_tier: profileMap.get(listing.user_id)?.subscription_tier ?? null,
				seller_verified: profileMap.get(listing.user_id)?.is_verified ?? false,
				seller_shop: profileMap.get(listing.user_id)?.shop_slug ?? null,
				seller_name: profileMap.get(listing.user_id)?.business_name ?? null
			})).sort((a, b) => {
				if (a.is_promoted !== b.is_promoted) return a.is_promoted ? -1 : 1;
				if (a.seller_verified !== b.seller_verified) return a.seller_verified ? -1 : 1;
				return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
			});
		}
	});
	const { data: stats } = useQuery({
		queryKey: ["platform-stats"],
		enabled: !isFiltering,
		queryFn: async () => {
			const [{ count: listingsCount }, { count: shopsCount }, { count: sellersCount }] = await Promise.all([
				supabase.from("listings").select("*", {
					count: "exact",
					head: true
				}).eq("status", "approved"),
				supabase.from("shops").select("*", {
					count: "exact",
					head: true
				}),
				supabase.from("public_profiles").select("*", {
					count: "exact",
					head: true
				})
			]);
			return {
				total_listings: listingsCount ?? 0,
				active_shops: shopsCount ?? 0,
				verified_vendors: sellersCount ?? 0,
				active_categories: CATEGORIES.length
			};
		}
	});
	const { data: catCounts = [] } = useQuery({
		queryKey: ["category-counts"],
		queryFn: async () => {
			const { data, error } = await supabase.from("listings").select("category").eq("status", "approved");
			if (error) throw error;
			const counts = {};
			data?.forEach((item) => {
				if (item.category) counts[item.category] = (counts[item.category] || 0) + 1;
			});
			return Object.entries(counts).map(([category, count]) => ({
				category,
				count
			}));
		}
	});
	const { data: vendors = [] } = useQuery({
		queryKey: ["featured-shops"],
		enabled: !isFiltering,
		queryFn: async () => {
			const { data, error } = await supabase.from("public_profiles").select("*").not("shop_slug", "is", null).order("created_at", { ascending: false }).limit(6);
			if (error) throw error;
			return data ?? [];
		}
	});
	const { data: trendingListings = [] } = useQuery({
		queryKey: ["trending-listings"],
		enabled: !isFiltering,
		queryFn: async () => {
			const { data, error } = await supabase.from("listings").select(`
          id, title, price, type, location, images, is_promoted, category, description, views_count, clicks_count, user_id, created_at
        `).eq("status", "approved").order("views_count", { ascending: false }).limit(8);
			if (error) throw error;
			const rows = data || [];
			const userIds = [...new Set(rows.map((r) => r.user_id))];
			if (!userIds.length) return rows;
			const { data: profiles } = await supabase.from("public_profiles").select(`id, subscription_tier, is_verified, business_name, shop_slug`).in("id", userIds);
			const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
			return rows.map((listing) => ({
				...listing,
				seller_tier: profileMap.get(listing.user_id)?.subscription_tier ?? null,
				seller_verified: profileMap.get(listing.user_id)?.is_verified ?? false,
				seller_shop: profileMap.get(listing.user_id)?.shop_slug ?? null,
				seller_name: profileMap.get(listing.user_id)?.business_name ?? null
			}));
		}
	});
	const { data: featuredArtisans = [] } = useQuery({
		queryKey: ["featured-artisans"],
		enabled: !isFiltering,
		queryFn: async () => {
			const { data, error } = await supabase.from("public_profiles").select(`
          id,
          full_name,
          business_name,
          profession,
          avatar_url,
          location,
          shop_slug,
          is_verified,
          avg_rating,
          active_listings
        `).not("profession", "is", null).not("shop_slug", "is", null).order("is_verified", { ascending: false }).order("avg_rating", { ascending: false }).limit(8);
			if (error) throw error;
			return data ?? [];
		}
	});
	const quickCategories = (0, import_react.useMemo)(() => {
		return CATEGORIES.map((category) => {
			const match = catCounts.find((c) => c.category === category.slug);
			return {
				...category,
				count: match?.count ?? 0
			};
		}).filter((category) => category.count > 0);
	}, [catCounts]);
	const trendingCategories = (0, import_react.useMemo)(() => {
		return [...quickCategories].sort((a, b) => b.count - a.count).slice(0, 6);
	}, [quickCategories]);
	const processedListings = (0, import_react.useMemo)(() => {
		let result = [...listings];
		switch (activeTab) {
			case "goods":
				result = result.filter((l) => l.type === "goods");
				break;
			case "service":
				result = result.filter((l) => l.type === "service");
				break;
			case "featured":
				result = result.filter((l) => l.is_promoted);
				break;
		}
		switch (sortBy) {
			case "price-low":
				result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
				break;
			case "price-high":
				result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
				break;
			case "popular":
				result.sort((a, b) => (b.views_count ?? 0) + (b.clicks_count ?? 0) - ((a.views_count ?? 0) + (a.clicks_count ?? 0)));
				break;
			case "oldest":
				result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
				break;
			default:
				result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
				break;
		}
		result.sort((a, b) => {
			if (a.is_promoted === b.is_promoted) return 0;
			return a.is_promoted ? -1 : 1;
		});
		return result;
	}, [
		listings,
		activeTab,
		sortBy
	]);
	const verifiedMerchants = (0, import_react.useMemo)(() => vendors.filter((v) => v.is_verified), [vendors]);
	const executeSearch = (e) => {
		e.preventDefault();
		navigate({ search: {
			q: searchInput || void 0,
			loc: selectedLocation !== "all" ? selectedLocation : void 0,
			cat: cat || void 0
		} });
	};
	const handleCategoryFilter = (slug) => {
		const isCurrentCat = cat === slug;
		navigate({ search: (prev) => ({
			...prev,
			cat: isCurrentCat ? void 0 : slug
		}) });
	};
	const clearAllFilters = () => {
		setSearchInput("");
		setSelectedLocation("all");
		navigate({ search: {} });
	};
	const activeCategoryLabel = (0, import_react.useMemo)(() => {
		if (!cat) return "";
		return CATEGORIES.find((c) => c.slug === cat)?.label ?? cat;
	}, [cat]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-muted/20 text-foreground flex flex-col justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}),
			!isFiltering && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:26px_26px]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "container mx-auto px-4 py-16 md:py-24 relative z-10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-4xl mx-auto text-center space-y-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur",
								children: "🇳🇬 Nigeria's Marketplace for Goods & Services"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
								className: "text-4xl md:text-6xl font-black leading-tight tracking-tight",
								children: [
									"Find Trusted Stores,",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
									"Products & Services Near You"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "max-w-2xl mx-auto text-primary-foreground/90 text-base md:text-lg leading-relaxed",
								children: "Shop from verified businesses, discover local services, compare prices and connect directly with trusted sellers across Nigeria."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "pt-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroSearch, {
									initialQ: q ?? "",
									initialLoc: loc ?? "all"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap justify-center gap-3 pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									size: "sm",
									variant: "secondary",
									className: "font-bold",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/dashboard",
										children: "Open Your Shop"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									size: "sm",
									variant: "ghost",
									className: "font-bold text-primary-foreground hover:bg-white/10",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/artisans",
										children: "Hire an Artisan"
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap justify-center gap-6 pt-8 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-5 w-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
											"Explore ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedCounter, { value: stats?.total_listings ?? 0 }) }),
											" Listings"
										] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "h-5 w-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedCounter, { value: stats?.active_shops ?? 0 }) }), " Shops"] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "h-5 w-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedCounter, { value: stats?.verified_vendors ?? 0 }) }), " Verified Sellers"] })]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "pt-6 max-w-2xl mx-auto text-left",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveActivityFeed, {})
							})
						]
					})
				})]
			}),
			!isFiltering && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "container mx-auto px-4 -mt-8 relative z-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 md:grid-cols-4 gap-4",
					children: [
						{
							label: "Listings",
							val: stats?.total_listings ?? 0,
							icon: Package,
							color: "text-blue-500 bg-blue-500/10"
						},
						{
							label: "Verified Sellers",
							val: stats?.verified_vendors ?? 0,
							icon: BadgeCheck,
							color: "text-emerald-500 bg-emerald-500/10"
						},
						{
							label: "Active Shops",
							val: stats?.active_shops ?? 0,
							icon: Store,
							color: "text-amber-500 bg-amber-500/10"
						},
						{
							label: "Categories",
							val: quickCategories.length,
							icon: LayoutGrid,
							color: "text-purple-500 bg-purple-500/10"
						}
					].map((s, i) => {
						const Ic = s.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-4 rounded-xl bg-background shadow-md border flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `hidden sm:flex p-3 rounded-lg ${s.color}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ic, { className: "h-5 w-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xl md:text-2xl font-extrabold",
								children: Number(s.val).toLocaleString()
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs uppercase tracking-wider font-semibold text-muted-foreground",
								children: s.label
							})] })]
						}, i);
					})
				})
			}),
			!isFiltering && verifiedMerchants.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "container mx-auto px-4 pt-12 pb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between mb-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "text-2xl font-bold flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "h-6 w-6 text-primary" }), "Featured Stores"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground mt-1",
						children: "Discover trusted businesses with active listings across Nigeria."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "outline",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/shops",
							children: "View All"
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4",
					children: verifiedMerchants.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/shop/$slug",
						params: { slug: v.shop_slug },
						className: "group rounded-2xl border bg-background overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-24 bg-gradient-to-br from-primary/10 via-primary/5 to-background flex items-center justify-center",
							children: v.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: v.avatar_url,
								className: "h-14 w-14 rounded-full object-cover border-2 border-background"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "h-6 w-6 text-primary" })
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-bold truncate text-sm",
									children: v.business_name || v.full_name
								}), v.is_verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "h-4 w-4 text-green-500 shrink-0" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted-foreground truncate mt-0.5",
								children: v.location || "Nigeria"
							})]
						})]
					}, v.id))
				})]
			}),
			!isFiltering && verifiedMerchants.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "container mx-auto px-4 py-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-gradient-to-r from-emerald-500/10 via-background to-background border border-emerald-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2 max-w-xl text-center md:text-left",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "h-3.5 w-3.5" }), " Verified Merchants Only"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-xl font-bold tracking-tight",
								children: "Trade Safely with Verified Merchants"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: "We review business credentials, historical fulfillment consistency, and identity markers so you can buy items or book trade services with absolute confidence."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "default",
						className: "bg-emerald-600 hover:bg-emerald-700 font-bold shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/shops",
							search: { verified: true },
							children: "Find Verified Sellers"
						})
					})]
				})
			}),
			!isFiltering && trendingListings.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "container mx-auto px-4 py-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between mb-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "h-6 w-6 text-orange-500 animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-2xl font-bold tracking-tight",
							children: "Trending Products"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						search: { sortBy: "popular" },
						className: "text-sm font-semibold text-primary hover:underline flex items-center gap-1",
						children: ["View All ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-4 w-4" })]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x",
					children: trendingListings.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "snap-start shrink-0 w-[220px]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListingCard, { l })
					}, l.id))
				})]
			}),
			!isFiltering && featuredArtisans.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "container mx-auto px-4 py-12",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							className: "mb-3 bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 gap-1",
							children: "🔥 Trending Professionals"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-3xl font-bold tracking-tight flex items-center gap-2",
							children: "Find Skilled Artisans Near You"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground mt-2 max-w-2xl text-sm",
							children: "Hire verified electricians, plumbers, mechanics, fashion designers, carpenters, photographers, cleaners, painters, welders, technicians and hundreds of skilled professionals across Nigeria."
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "outline",
						className: "self-start sm:self-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/artisans",
							children: "Browse All Artisans"
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6",
					children: featuredArtisans.map((artisan) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/shop/$slug",
						params: { slug: artisan.shop_slug },
						className: "group rounded-3xl border bg-card overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-28 bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center relative",
							children: artisan.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: artisan.avatar_url,
								className: "h-20 w-20 rounded-full object-cover border-4 border-background absolute -bottom-6 shadow-sm"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-20 w-20 rounded-full bg-background border-4 border-background flex items-center justify-center absolute -bottom-6 shadow-sm",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "h-10 w-10 text-primary" })
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pt-8 p-5 text-center sm:text-left",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-center sm:justify-start gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-bold truncate text-base",
										children: artisan.business_name || artisan.full_name
									}), artisan.is_verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "h-4 w-4 text-green-500 shrink-0" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium text-primary mt-1",
									children: artisan.profession
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground mt-2 flex items-center justify-center sm:justify-start gap-1",
									children: ["📍 ", artisan.location || "Nigeria"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mt-5 pt-3 border-t border-muted",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
										variant: "secondary",
										className: "font-bold text-xs",
										children: ["⭐ ", artisan.avg_rating ? Number(artisan.avg_rating).toFixed(1) : "New"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs font-medium text-muted-foreground",
										children: [artisan.active_listings ?? 0, " Jobs"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-primary font-bold mt-4 text-right opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-0.5",
									children: ["View Profile ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-3 w-3" })]
								})
							]
						})]
					}, artisan.id))
				})]
			}),
			!isFiltering && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "container mx-auto px-4 py-4 mb-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-t border-b border-muted py-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4",
						children: "Popular Services"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x",
						children: POPULAR_SERVICES.map((service) => {
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								onClick: () => {
									navigate({ search: (prev) => ({
										...prev,
										q: service.label
									}) });
								},
								className: "rounded-full flex items-center gap-2 h-10 px-5 shrink-0 hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium snap-start",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(lucide_react_exports[service.icon] ?? Wrench, { className: "h-4 w-4 text-primary" }), service.label]
							}, service.slug);
						})
					})]
				})
			}),
			!isFiltering && quickCategories.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "container mx-auto px-4 py-8 bg-muted/30 border-y border-muted-foreground/10 my-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-4xl mb-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-2xl font-bold tracking-tight",
						children: "Browse by Category"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground mt-1",
						children: "Explore thousands of verified products and services organized explicitly by trade class."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4",
					children: quickCategories.map((c) => {
						const Ic = lucide_react_exports[c.icon] ?? Tag;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "ghost",
							onClick: () => handleCategoryFilter(c.slug),
							className: `h-auto flex flex-col items-center justify-center text-center rounded-2xl border p-5 transition-all group normal-case whitespace-normal ${cat === c.slug ? "border-accent bg-accent/10 ring-2 ring-accent hover:bg-accent/10" : "bg-background hover:border-primary hover:shadow-md hover:bg-background"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ic, { className: "h-6 w-6 text-primary" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-bold truncate max-w-[140px] text-foreground",
									children: c.label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground mt-1 font-medium bg-muted px-2 py-0.5 rounded-full",
									children: c.count.toLocaleString()
								})
							]
						}, c.slug);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				ref: listingsRef,
				className: "container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-8 scroll-mt-16",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "lg:col-span-1 space-y-6",
					children: [!isFiltering && trendingCategories.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "border shadow-sm overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "bg-primary text-primary-foreground px-4 py-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "text-sm font-bold uppercase tracking-wider flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "h-4 w-4 text-orange-300" }), " Top Categories"]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-3 space-y-2",
							children: trendingCategories.map((tc) => {
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "ghost",
									onClick: () => handleCategoryFilter(tc.slug),
									className: "w-full h-auto justify-start flex items-center gap-3 rounded-xl border p-3 text-left transition-all hover:border-primary hover:bg-primary/5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(lucide_react_exports[tc.icon] ?? Tag, { className: "h-5 w-5 text-primary" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1 min-w-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-semibold truncate text-foreground",
												children: tc.label
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs text-muted-foreground",
												children: [tc.count.toLocaleString(), " active listings"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4 text-muted-foreground shrink-0 ml-auto" })
									]
								}, tc.slug);
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "p-4 border shadow-sm space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-bold uppercase tracking-wider text-muted-foreground",
							children: "Filter Listings"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: executeSearch,
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-xs font-semibold text-muted-foreground",
										children: "Keywords"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "text",
											placeholder: "Search items...",
											value: searchInput,
											onChange: (e) => setSearchInput(e.target.value),
											className: "w-full bg-background border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-xs font-semibold text-muted-foreground",
										children: "State Location"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: selectedLocation,
										onValueChange: setSelectedLocation,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "w-full bg-background",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select Location" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "all",
											children: "All Nigeria"
										}), LOCATIONS.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: l,
											children: l
										}, l))] })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									className: "w-full font-bold",
									children: "Apply Filters"
								}),
								isFiltering && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "ghost",
									onClick: clearAllFilters,
									className: "w-full text-xs",
									children: "Clear Active Filters"
								})
							]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "lg:col-span-3 space-y-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl font-black tracking-tight",
							children: isFiltering ? `Search Results ${activeCategoryLabel ? `in ${activeCategoryLabel}` : ""}` : "Explore Marketplace Feed"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground mt-0.5",
							children: [
								"Showing ",
								processedListings.length,
								" approved listings across chosen filters."
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-3 w-full sm:w-auto",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tabs, {
								value: activeTab,
								onValueChange: (v) => setActiveTab(v),
								className: "w-full sm:w-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
									className: "grid grid-cols-4 w-full sm:w-auto",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "all",
											className: "text-xs font-bold",
											children: "All"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "goods",
											className: "text-xs font-bold",
											children: "Goods"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "service",
											className: "text-xs font-bold",
											children: "Services"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "featured",
											className: "text-xs font-bold",
											children: "Featured"
										})
									]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: sortBy,
								onValueChange: (v) => setSortBy(v),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "w-full sm:w-[140px] bg-background",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Sort By" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "newest",
										children: "Newest First"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "oldest",
										children: "Oldest First"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "popular",
										children: "Popularity"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "price-low",
										children: "Price: Low to High"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "price-high",
										children: "Price: High to Low"
									})
								] })]
							})]
						})]
					}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-12",
						children: [...Array(8)].map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-[280px] bg-muted animate-pulse rounded-2xl" }, i))
					}) : processedListings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "p-12 text-center max-w-md mx-auto space-y-4 border border-dashed rounded-2xl",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchX, { className: "h-6 w-6 text-muted-foreground" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "font-bold",
									children: "No items match your criteria"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Try loosening search keywords, selecting standard categories, or switching states."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								onClick: clearAllFilters,
								children: "Reset All View Filters"
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4",
						children: processedListings.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListingCard, { l }, l.id))
					})]
				})]
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
			className: "bg-muted/40 border-t py-6 text-center text-xs text-muted-foreground",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"© ",
				(/* @__PURE__ */ new Date()).getFullYear(),
				" Tile Marketplace. Connecting trustworthy commercial hubs safely across Nigeria."
			] })
		})]
	});
}
//#endregion
export { Index as component };
