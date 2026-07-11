import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-B0U85Udx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useAuth } from "./auth-context-ufRsuJHL.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { n as cn, t as Button } from "./button-Bq5vK6RO.mjs";
import { t as Card } from "./card-CzXpCsbD.mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { $ as Gauge, Ct as BadgeCheck, E as Search, L as Megaphone, S as ShieldAlert, W as LifeBuoy, _ as Sparkles, bt as Bell, c as UserSearch, d as TriangleAlert, f as TrendingUp, kt as Activity, m as Tag, mt as Check, nt as FileExclamationPoint, o as Users, ot as Copy, q as KeyRound, r as X, tt as Flag, w as Settings2, x as ShieldCheck, xt as Banknote } from "../_libs/lucide-react.mjs";
import { a as Portal, i as Overlay, n as Content, o as Root, r as Description, s as Title, t as Close } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { t as SiteHeader } from "./site-header-DuVnqON_.mjs";
import { t as Badge } from "./badge-D1Dupn2y.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { t as Progress } from "./progress-DOIEKRJF.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-CCJRliUM.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, o as DialogTrigger, r as DialogFooter, t as Dialog } from "./dialog-B8mBdC_P.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Dg1urBTx.mjs";
import { t as Textarea } from "./textarea-kko37XEX.mjs";
import { r as formatNaira } from "./categories-j3aLXACs.mjs";
import { n as getSignedUrls } from "./storage-BCLwX12s.mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/radix-ui__react-switch.mjs";
import { a as Area, c as Cell, d as Legend, i as XAxis, l as ResponsiveContainer, n as PieChart, o as CartesianGrid, r as YAxis, s as Pie, t as AreaChart, u as Tooltip } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-D-9LfUIt.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Switch = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
	className: cn("peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input", className),
	...props,
	ref,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: cn("pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0") })
}));
Switch.displayName = Switch$1.displayName;
var Table = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: "relative w-full overflow-auto",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
		ref,
		className: cn("w-full caption-bottom text-sm", className),
		...props
	})
}));
Table.displayName = "Table";
var TableHeader = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
	ref,
	className: cn("[&_tr]:border-b", className),
	...props
}));
TableHeader.displayName = "TableHeader";
var TableBody = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
	ref,
	className: cn("[&_tr:last-child]:border-0", className),
	...props
}));
TableBody.displayName = "TableBody";
var TableFooter = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", {
	ref,
	className: cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className),
	...props
}));
TableFooter.displayName = "TableFooter";
var TableRow = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
	ref,
	className: cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className),
	...props
}));
TableRow.displayName = "TableRow";
var TableHead = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
	ref,
	className: cn("h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className),
	...props
}));
TableHead.displayName = "TableHead";
var TableCell = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
	ref,
	className: cn("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className),
	...props
}));
TableCell.displayName = "TableCell";
var TableCaption = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
	ref,
	className: cn("mt-4 text-sm text-muted-foreground", className),
	...props
}));
TableCaption.displayName = "TableCaption";
var Sheet = Root;
var SheetPortal = Portal;
var SheetOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay, {
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
SheetOverlay.displayName = Overlay.displayName;
var sheetVariants = cva("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out", {
	variants: { side: {
		top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
		bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
		left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
		right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
	} },
	defaultVariants: { side: "right" }
});
var SheetContent = import_react.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Content, {
	ref,
	className: cn(sheetVariants({ side }), className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Close, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	}), children]
})] }));
SheetContent.displayName = Content.displayName;
var SheetHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
SheetFooter.displayName = "SheetFooter";
var SheetTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Title, {
	ref,
	className: cn("text-lg font-semibold text-foreground", className),
	...props
}));
SheetTitle.displayName = Title.displayName;
var SheetDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Description, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
SheetDescription.displayName = Description.displayName;
function Admin() {
	const { isAdmin, loading } = useAuth();
	const nav = useNavigate();
	const qc = useQueryClient();
	const { data: dash } = useQuery({
		queryKey: ["admin-dashboard-stats"],
		enabled: isAdmin,
		refetchInterval: 3e4,
		queryFn: async () => {
			const { data, error } = await supabase.rpc("admin_dashboard_stats");
			if (error) throw error;
			return Array.isArray(data) ? data[0] : data;
		}
	});
	const { data: stats } = useQuery({
		queryKey: ["admin-stats"],
		enabled: isAdmin,
		queryFn: async () => {
			const [u, a, r] = await Promise.all([
				supabase.from("profiles").select("id", {
					count: "exact",
					head: true
				}),
				supabase.from("listings").select("id", {
					count: "exact",
					head: true
				}).eq("status", "approved"),
				supabase.rpc("admin_revenue_stats")
			]);
			const rev = r.data?.[0] ?? null;
			return {
				users: u.count ?? 0,
				ads: a.count ?? 0,
				revenue: Number(rev?.total_revenue ?? 0),
				monthly: Number(rev?.monthly_revenue ?? 0),
				yearly: Number(rev?.yearly_revenue ?? 0),
				active: Number(rev?.active_subscribers ?? 0),
				lite: Number(rev?.lite_active ?? 0),
				pro: Number(rev?.pro_active ?? 0),
				vip: Number(rev?.vip_active ?? 0)
			};
		}
	});
	const { data: activity = [] } = useQuery({
		queryKey: ["admin-activity-feed"],
		enabled: isAdmin,
		refetchInterval: 15e3,
		queryFn: async () => {
			const { data } = await supabase.rpc("admin_activity_feed", { _limit: 30 });
			return data ?? [];
		}
	});
	const { data: modQueue = [] } = useQuery({
		queryKey: ["admin-mod-queue"],
		enabled: isAdmin,
		refetchInterval: 6e4,
		queryFn: async () => {
			const { data } = await supabase.rpc("admin_moderation_queue");
			return data ?? [];
		}
	});
	const pending = modQueue;
	const [reportFilter, setReportFilter] = (0, import_react.useState)("open");
	const { data: reports = [] } = useQuery({
		queryKey: ["admin-reports", reportFilter],
		enabled: isAdmin,
		queryFn: async () => {
			const { data } = await supabase.rpc("admin_list_reports", { _status: reportFilter });
			return data ?? [];
		}
	});
	const { data: trend = [] } = useQuery({
		queryKey: ["admin-revenue-trend"],
		enabled: isAdmin,
		queryFn: async () => {
			const since = (/* @__PURE__ */ new Date(Date.now() - 30 * 864e5)).toISOString();
			const { data } = await supabase.from("wallet_transactions").select("amount,tx_type,created_at").in("tx_type", ["subscription", "promotion"]).gte("created_at", since);
			const byDay = /* @__PURE__ */ new Map();
			(data ?? []).forEach((t) => {
				const d = new Date(t.created_at).toISOString().slice(0, 10);
				byDay.set(d, (byDay.get(d) ?? 0) + Math.abs(Number(t.amount)));
			});
			const out = [];
			for (let i = 29; i >= 0; i--) {
				const d = (/* @__PURE__ */ new Date(Date.now() - i * 864e5)).toISOString().slice(0, 10);
				out.push({
					day: d.slice(5),
					revenue: Math.round(byDay.get(d) ?? 0)
				});
			}
			return out;
		}
	});
	const { data: platform } = useQuery({
		queryKey: ["admin-platform-settings"],
		enabled: isAdmin,
		queryFn: async () => {
			const { data } = await supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle();
			return data;
		}
	});
	const { data: kycPending = [] } = useQuery({
		queryKey: ["kyc-pending"],
		enabled: isAdmin,
		queryFn: async () => {
			const { data } = await supabase.rpc("admin_list_pending_kyc");
			return data ?? [];
		}
	});
	const { data: txns = [] } = useQuery({
		queryKey: ["txns"],
		enabled: isAdmin,
		queryFn: async () => {
			const { data } = await supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }).limit(50);
			return data ?? [];
		}
	});
	const { data: users = [] } = useQuery({
		queryKey: ["admin-users"],
		enabled: isAdmin,
		queryFn: async () => {
			const { data } = await supabase.rpc("admin_list_users");
			return data ?? [];
		}
	});
	const { data: codes = [] } = useQuery({
		queryKey: ["admin-codes"],
		enabled: isAdmin,
		queryFn: async () => {
			const { data } = await supabase.rpc("admin_list_invite_codes");
			return data ?? [];
		}
	});
	const generateCode = async () => {
		const { data, error } = await supabase.rpc("admin_generate_invite_code");
		if (error) return toast.error(error.message);
		toast.success(`New admin code: ${data}`);
		qc.invalidateQueries({ queryKey: ["admin-codes"] });
	};
	if (!loading && !isAdmin) {
		nav({ to: "/" });
		return null;
	}
	const approve = async (id) => {
		const { error } = await supabase.rpc("admin_approve_listing", { _id: id });
		if (error) return toast.error(error.message);
		toast.success("Approved");
		qc.invalidateQueries({ queryKey: ["admin-mod-queue"] });
	};
	const reject = async (id, reason) => {
		const { error } = await supabase.rpc("admin_reject_listing", {
			_id: id,
			_reason: reason
		});
		if (error) return toast.error(error.message);
		toast.success("Rejected");
		qc.invalidateQueries({ queryKey: ["admin-mod-queue"] });
	};
	const flag = async (id) => {
		const { error } = await supabase.rpc("admin_flag_seller", { _listing_id: id });
		if (error) return toast.error(error.message);
		toast.success("Seller flagged & listing removed");
		qc.invalidateQueries({ queryKey: ["admin-mod-queue"] });
	};
	const grantVerified = async (id) => {
		await supabase.from("profiles").update({
			kyc_status: "verified",
			is_verified: true
		}).eq("id", id);
		toast.success("Verified badge granted");
		qc.invalidateQueries({ queryKey: ["kyc-pending"] });
	};
	const [selected, setSelected] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const toggleSel = (id) => setSelected((s) => {
		const n = new Set(s);
		n.has(id) ? n.delete(id) : n.add(id);
		return n;
	});
	const bulk = async (action) => {
		if (!selected.size) return toast.error("Select at least one listing");
		if (!confirm(`${action.toUpperCase()} ${selected.size} listings?`)) return;
		const ids = [...selected];
		for (const id of ids) if (action === "approve") await supabase.rpc("admin_approve_listing", { _id: id });
		else if (action === "reject") await supabase.rpc("admin_reject_listing", {
			_id: id,
			_reason: "Bulk rejection"
		});
		else await supabase.rpc("admin_flag_seller", { _listing_id: id });
		toast.success(`${ids.length} listings ${action}ed`);
		setSelected(/* @__PURE__ */ new Set());
		qc.invalidateQueries({ queryKey: ["admin-mod-queue"] });
	};
	const [inspectId, setInspectId] = (0, import_react.useState)(null);
	const [userQuery, setUserQuery] = (0, import_react.useState)("");
	const filteredUsers = (0, import_react.useMemo)(() => {
		const q = userQuery.trim().toLowerCase();
		if (!q) return users;
		return users.filter((u) => (u.full_name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q));
	}, [users, userQuery]);
	const tierData = [
		{
			name: "VIP",
			value: dash?.vip ?? 0,
			color: "#f59e0b"
		},
		{
			name: "Pro",
			value: dash?.pro ?? 0,
			color: "#3b82f6"
		},
		{
			name: "Lite",
			value: dash?.lite ?? 0,
			color: "#10b981"
		}
	];
	const health = (0, import_react.useMemo)(() => {
		if (!dash) return {
			score: 0,
			label: "—"
		};
		const reports = dash.reports_open;
		const kyc = dash.kyc_pending;
		const pending = dash.listings_pending;
		let score = 100;
		score -= Math.min(30, reports * 3);
		score -= Math.min(20, kyc * 2);
		score -= Math.min(20, Math.max(0, pending - 20));
		score = Math.max(0, score);
		return {
			score,
			label: score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Needs attention" : "Critical"
		};
	}, [dash]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}),
			platform?.maintenance_mode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-destructive text-destructive-foreground text-center text-sm py-2 font-semibold",
				children: "⚠ Maintenance mode is ACTIVE — public actions are frozen"
			}),
			platform?.emergency_banner && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-amber-500 text-black text-center text-sm py-2 font-semibold",
				children: platform.emergency_banner
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "container mx-auto px-4 py-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "text-2xl md:text-3xl font-bold flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "text-accent" }), " Operations Center"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground",
							children: "Mission control for the Tile marketplace"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 rounded-lg border bg-card px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { className: "h-5 w-5 " + (health.score >= 70 ? "text-emerald-500" : "text-amber-500") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] uppercase text-muted-foreground font-bold",
								children: "Marketplace health"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm font-bold",
								children: [
									health.score,
									" · ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: health.label
									})
								]
							})] })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 my-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniStat, {
								label: "Users",
								value: dash?.users_total ?? stats?.users ?? 0,
								sub: `+${dash?.users_today ?? 0} today`,
								icon: Users,
								tint: "blue"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniStat, {
								label: "Listings",
								value: dash?.listings_total ?? 0,
								sub: `+${dash?.listings_today ?? 0} today`,
								icon: Tag,
								tint: "green"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniStat, {
								label: "Revenue",
								value: formatNaira(dash?.revenue_total ?? stats?.revenue ?? 0),
								sub: `+${formatNaira(dash?.revenue_today ?? 0)} today`,
								icon: Banknote,
								tint: "amber"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniStat, {
								label: "Subscribers",
								value: dash?.active_subscribers ?? 0,
								sub: `VIP ${dash?.vip ?? 0} · Pro ${dash?.pro ?? 0}`,
								icon: BadgeCheck,
								tint: "purple"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniStat, {
								label: "Chats (24h)",
								value: dash?.chats_24h ?? 0,
								sub: `${dash?.shops_total ?? 0} shops`,
								icon: Activity,
								tint: "cyan"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniStat, {
								label: "Artisans",
								value: dash?.artisans_total ?? 0,
								sub: "Directory",
								icon: Sparkles,
								tint: "rose"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueueCard, {
								label: "Pending listings",
								count: dash?.listings_pending ?? 0,
								icon: Tag,
								onClick: () => document.getElementById("tab-moderation")?.click()
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueueCard, {
								label: "Pending KYC",
								count: dash?.kyc_pending ?? 0,
								icon: ShieldCheck,
								onClick: () => document.getElementById("tab-kyc")?.click()
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueueCard, {
								label: "Open reports",
								count: dash?.reports_open ?? 0,
								icon: FileExclamationPoint,
								onClick: () => document.getElementById("tab-reports")?.click()
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueueCard, {
								label: "Monthly revenue",
								count: formatNaira(dash?.revenue_month ?? 0),
								icon: TrendingUp,
								onClick: () => document.getElementById("tab-money")?.click()
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
						defaultValue: "overview",
						className: "w-full",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "overflow-x-auto scrollbar-hide pb-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
									className: "inline-flex w-max min-w-full md:min-w-0 gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											id: "tab-overview",
											value: "overview",
											className: "whitespace-nowrap",
											children: "📊 Overview"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											id: "tab-moderation",
											value: "moderation",
											className: "whitespace-nowrap",
											children: "🛡 Moderation"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											id: "tab-reports",
											value: "reports",
											className: "whitespace-nowrap",
											children: "🚩 Reports"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											id: "tab-kyc",
											value: "kyc",
											className: "whitespace-nowrap",
											children: "📄 KYC"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											id: "tab-money",
											value: "money",
											className: "whitespace-nowrap",
											children: "💳 Revenue"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											id: "tab-users",
											value: "users",
											className: "whitespace-nowrap",
											children: "👥 Users"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "broadcast",
											className: "whitespace-nowrap",
											children: "📣 Broadcast"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "settings",
											className: "whitespace-nowrap",
											children: "⚙ Platform"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "codes",
											className: "whitespace-nowrap",
											children: "🎟 Admin Codes"
										})
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "overview",
								className: "mt-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-1 lg:grid-cols-3 gap-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
											className: "p-4 lg:col-span-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between mb-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
													className: "font-semibold flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "h-4 w-4 text-emerald-500" }), " Revenue — last 30 days"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-sm text-muted-foreground",
													children: ["Total: ", formatNaira(trend.reduce((s, t) => s + t.revenue, 0))]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-64",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
													width: "100%",
													height: "100%",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
														data: trend,
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
																id: "rev",
																x1: "0",
																y1: "0",
																x2: "0",
																y2: "1",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
																	offset: "0%",
																	stopColor: "hsl(var(--primary))",
																	stopOpacity: .5
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
																	offset: "100%",
																	stopColor: "hsl(var(--primary))",
																	stopOpacity: 0
																})]
															}) }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
																strokeDasharray: "3 3",
																opacity: .2
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
																dataKey: "day",
																fontSize: 11
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
																fontSize: 11,
																tickFormatter: (v) => `₦${(v / 1e3).toFixed(0)}k`
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { formatter: (v) => formatNaira(v) }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
																type: "monotone",
																dataKey: "revenue",
																stroke: "hsl(var(--primary))",
																fill: "url(#rev)",
																strokeWidth: 2
															})
														]
													})
												})
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
											className: "p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
												className: "font-semibold mb-3 flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "h-4 w-4 text-primary" }), " Active subscribers"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-64",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
													width: "100%",
													height: "100%",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PieChart, { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pie, {
															data: tierData,
															dataKey: "value",
															nameKey: "name",
															innerRadius: 50,
															outerRadius: 90,
															paddingAngle: 4,
															children: tierData.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: d.color }, d.name))
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {})
													] })
												})
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
											className: "p-4 lg:col-span-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between mb-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
													className: "font-semibold flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "h-4 w-4 text-emerald-500 animate-pulse" }), " Live activity feed"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: "outline",
													className: "text-xs",
													children: "Auto-refresh · 15s"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "divide-y max-h-96 overflow-y-auto",
												children: [activity.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-center text-muted-foreground py-8",
													children: "No recent activity"
												}), activity.map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-3 py-2 text-sm",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivityDot, { kind: a.kind }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-medium",
															children: a.title
														}),
														a.subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "text-muted-foreground text-xs truncate",
															children: ["· ", a.subtitle]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "ml-auto text-xs text-muted-foreground whitespace-nowrap",
															children: timeAgo(a.at)
														})
													]
												}, `${a.kind}-${a.entity_id}-${i}`))]
											})]
										})
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "moderation",
								className: "mt-4",
								children: [selected.size > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
									className: "p-3 mb-3 flex flex-wrap items-center gap-2 border-primary/50 bg-primary/5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-sm font-semibold",
											children: [selected.size, " selected"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											onClick: () => bulk("approve"),
											className: "bg-emerald-600 hover:bg-emerald-700",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3 mr-1" }), "Approve all"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											variant: "outline",
											onClick: () => bulk("reject"),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3 w-3 mr-1" }), "Reject all"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											variant: "destructive",
											onClick: () => bulk("flag"),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { className: "h-3 w-3 mr-1" }), "Flag sellers"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "ghost",
											onClick: () => setSelected(/* @__PURE__ */ new Set()),
											children: "Clear"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
									className: "p-0 overflow-x-auto",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { className: "w-8" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Title" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Seller" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Risk" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Price" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "text-right",
											children: "Actions"
										})
									] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [pending.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										colSpan: 6,
										className: "text-center text-muted-foreground py-8",
										children: "🎉 Nothing pending — inbox zero"
									}) }), pending.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: selected.has(l.id),
											onChange: () => toggleSel(l.id),
											className: "h-4 w-4"
										}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "font-medium",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PendingTitle, { l })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
											className: "text-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => setInspectId(l.seller_id),
												className: "hover:text-primary underline-offset-2 hover:underline text-left",
												children: l.seller_name ?? "—"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-xs text-muted-foreground",
												children: [l.account_age_days, "d old"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RiskCell, {
											score: l.risk_score,
											reasons: l.risk_reasons ?? []
										}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: formatNaira(l.price) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
											className: "text-right space-x-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													size: "sm",
													onClick: () => approve(l.id),
													className: "bg-accent text-accent-foreground",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3 mr-1" }), "Approve"]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RejectModal, { onConfirm: (r) => reject(l.id, r) }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													size: "sm",
													variant: "destructive",
													onClick: () => flag(l.id),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { className: "h-3 w-3 mr-1" }), "Flag"]
												})
											]
										})
									] }, l.id))] })] })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "reports",
								className: "mt-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center gap-2 mb-3",
									children: [
										"open",
										"resolved",
										"dismissed"
									].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: reportFilter === s ? "default" : "outline",
										onClick: () => setReportFilter(s),
										className: "capitalize",
										children: s
									}, s))
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
									className: "p-0 overflow-x-auto",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Target" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Reason" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Reporter" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "When" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "text-right",
											children: "Actions"
										})
									] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [reports.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
										colSpan: 5,
										className: "text-center text-muted-foreground py-8",
										children: [
											"No ",
											reportFilter,
											" reports"
										]
									}) }), reports.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: "capitalize",
											children: r.entity_type
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "font-mono text-[10px] text-muted-foreground mt-1",
											children: [r.entity_id.slice(0, 8), "…"]
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
											className: "text-sm max-w-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "font-medium",
												children: r.reason
											}), r.details && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-xs text-muted-foreground truncate",
												children: r.details
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "text-xs",
											children: r.reporter_name ?? "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "text-xs whitespace-nowrap",
											children: timeAgo(r.created_at)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "text-right",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportActions, {
												report: r,
												onDone: () => qc.invalidateQueries({ queryKey: ["admin-reports"] })
											})
										})
									] }, r.id))] })] })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "kyc",
								className: "mt-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
									className: "p-0 overflow-x-auto",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "User" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Phone" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Document" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "text-right",
											children: "Action"
										})
									] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [kycPending.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										colSpan: 5,
										className: "text-center text-muted-foreground py-8",
										children: "No pending KYC"
									}) }), kycPending.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "font-medium",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => setInspectId(p.id),
												className: "hover:text-primary underline-offset-2 hover:underline text-left",
												children: p.full_name
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: p.phone ?? "—" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											className: "capitalize",
											children: p.kyc_status
										}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "font-mono text-xs",
											children: p.kyc_doc_url ? "uploaded" : "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "text-right",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												size: "sm",
												onClick: () => grantVerified(p.id),
												className: "bg-accent text-accent-foreground",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "h-3 w-3 mr-1" }), "Grant Verified"]
											})
										})
									] }, p.id))] })] })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "money",
								className: "mt-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
											className: "p-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] uppercase text-muted-foreground font-bold",
												children: "Today"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-lg font-extrabold",
												children: formatNaira(dash?.revenue_today ?? 0)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
											className: "p-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] uppercase text-muted-foreground font-bold",
												children: "This month"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-lg font-extrabold",
												children: formatNaira(dash?.revenue_month ?? 0)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
											className: "p-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] uppercase text-muted-foreground font-bold",
												children: "This year"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-lg font-extrabold",
												children: formatNaira(stats?.yearly ?? 0)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
											className: "p-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] uppercase text-muted-foreground font-bold",
												children: "Lifetime"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-lg font-extrabold",
												children: formatNaira(dash?.revenue_total ?? 0)
											})]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
									className: "p-0 overflow-x-auto",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "When" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Type" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Amount" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Reference" })
									] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [txns.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										colSpan: 4,
										className: "text-center text-muted-foreground py-8",
										children: "No transactions yet"
									}) }), txns.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "text-xs",
											children: new Date(t.created_at).toLocaleString()
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											className: "capitalize",
											children: t.tx_type
										}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: Number(t.amount) < 0 ? "text-destructive" : "text-accent",
											children: formatNaira(Number(t.amount))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "font-mono text-xs",
											children: t.reference ?? "—"
										})
									] }, t.id))] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "p-4 text-xs text-muted-foreground border-t",
										children: "Plan prices: Lite ₦5,000 · Pro ₦15,000 · VIP ₦40,000"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "users",
								className: "mt-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-3 relative max-w-md",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										placeholder: "Search by name or email…",
										value: userQuery,
										onChange: (e) => setUserQuery(e.target.value),
										className: "pl-9"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
									className: "p-0 overflow-x-auto",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Name" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Email" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Tier" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "KYC" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "text-right",
											children: "Active Ads"
										})
									] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [filteredUsers.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										colSpan: 5,
										className: "text-center text-muted-foreground py-8",
										children: "No users match"
									}) }), filteredUsers.slice(0, 100).map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "font-medium",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												onClick: () => setInspectId(u.id),
												className: "hover:text-primary underline-offset-2 hover:underline text-left flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserSearch, { className: "h-3.5 w-3.5" }), u.full_name ?? "—"]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "text-xs",
											children: u.email ?? "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											className: "capitalize",
											children: u.subscription_tier
										}), u.is_verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "inline h-4 w-4 text-accent ml-1" })] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "text-xs capitalize",
											children: u.kyc_status ?? "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "text-right font-mono",
											children: u.active_ads
										})
									] }, u.id))] })] }), filteredUsers.length > 100 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3 text-xs text-muted-foreground text-center border-t",
										children: [
											"Showing first 100 of ",
											filteredUsers.length,
											". Refine your search."
										]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "broadcast",
								className: "mt-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BroadcastPanel, {})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "settings",
								className: "mt-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlatformSettings, {
									initial: platform,
									onSaved: () => qc.invalidateQueries({ queryKey: ["admin-platform-settings"] })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "codes",
								className: "mt-4 space-y-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
									className: "p-4 flex items-center justify-between gap-3 flex-wrap",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-semibold flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "h-4 w-4" }), "One-Time Admin Authorization"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "Generates an 8-char code (e.g. TILE-ADMIN-XXXXXXXX). Single-use, expires 30 minutes after creation."
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										onClick: generateCode,
										className: "bg-accent text-accent-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "h-4 w-4 mr-1" }), "Generate code"]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
									className: "p-0 overflow-x-auto",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Code" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Created" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Expires" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Used At" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {})
									] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [codes.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										colSpan: 6,
										className: "text-center text-muted-foreground py-8",
										children: "No codes yet"
									}) }), codes.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "font-mono text-xs",
											children: c.code
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "text-xs",
											children: new Date(c.created_at).toLocaleString()
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "text-xs",
											children: new Date(c.expires_at).toLocaleString()
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "text-xs",
											children: c.used_at ? new Date(c.used_at).toLocaleString() : "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											className: c.status === "active" ? "bg-emerald-600 text-white" : c.status === "used" ? "bg-muted text-muted-foreground" : "bg-destructive text-destructive-foreground",
											children: c.status
										}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: c.status === "active" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "outline",
											onClick: () => {
												navigator.clipboard.writeText(c.code);
												toast.success("Code copied");
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-3 w-3" })
										}) })
									] }, c.code))] })] })
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserInspector, {
						id: inspectId,
						onClose: () => setInspectId(null)
					})
				]
			})
		]
	});
}
function RejectModal({ onConfirm }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [reason, setReason] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				variant: "outline",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3 w-3 mr-1" }), "Reject"]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Reject listing" }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				value: reason,
				onChange: (e) => setReason(e.target.value),
				placeholder: "Reason (sent to vendor)",
				rows: 4
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => {
					onConfirm(reason);
					setOpen(false);
				},
				variant: "destructive",
				children: "Confirm reject"
			}) })
		] })]
	});
}
function PendingTitle({ l }) {
	const [urls, setUrls] = (0, import_react.useState)([]);
	const [open, setOpen] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (l.images?.length) getSignedUrls(l.images).then(setUrls);
	}, [l.images]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			urls[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => setOpen(true),
				className: "h-12 w-12 rounded overflow-hidden border hover:border-accent",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: urls[0],
					alt: "",
					className: "w-full h-full object-cover"
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-12 w-12 rounded bg-muted inline-block" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: `/listing/${l.id}`,
					target: "_blank",
					rel: "noreferrer",
					className: "hover:text-accent underline-offset-2 hover:underline",
					children: l.title
				}), l.type === "goods" && (l.images?.length ?? 0) < 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					variant: "destructive",
					className: "ml-2 gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-3 w-3" }), "Low image count"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open,
				onOpenChange: setOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-3xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: [
							l.title,
							" — images (",
							urls.length,
							")"
						] }) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto",
							children: urls.map((u, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: u,
								alt: "",
								className: "w-full rounded border"
							}, i))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							variant: "outline",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: `/listing/${l.id}`,
								target: "_blank",
								rel: "noreferrer",
								children: "Open full listing"
							})
						}) })
					]
				})
			})
		]
	});
}
var TINTS = {
	blue: "from-blue-500/15 to-blue-500/5 text-blue-600 dark:text-blue-400",
	green: "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
	amber: "from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400",
	purple: "from-purple-500/15 to-purple-500/5 text-purple-600 dark:text-purple-400",
	cyan: "from-cyan-500/15 to-cyan-500/5 text-cyan-600 dark:text-cyan-400",
	rose: "from-rose-500/15 to-rose-500/5 text-rose-600 dark:text-rose-400"
};
function MiniStat({ label, value, sub, icon: Icon, tint = "blue" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
		className: `p-4 bg-gradient-to-br ${TINTS[tint] ?? TINTS.blue} border-border/50`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] uppercase tracking-wide font-bold text-muted-foreground",
						children: label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xl font-extrabold mt-1 text-foreground truncate",
						children: value
					}),
					sub && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] text-muted-foreground mt-0.5 truncate",
						children: sub
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-5 w-5 opacity-70" })]
		})
	});
}
function QueueCard({ label, count, icon: Icon, onClick }) {
	const isEmpty = count === 0 || count === "₦0";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: `text-left rounded-lg border p-4 transition-colors hover:border-primary/50 ${isEmpty ? "bg-card" : "bg-primary/5 border-primary/40"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 text-xs text-muted-foreground uppercase font-bold",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-3.5 w-3.5" }), label]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-2xl font-extrabold mt-2",
				children: count
			}),
			!isEmpty && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[10px] text-primary mt-1 font-semibold",
				children: "Needs attention →"
			})
		]
	});
}
function ActivityDot({ kind }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-2 w-2 rounded-full ${{
		signup: "bg-blue-500",
		listing: "bg-emerald-500",
		payment: "bg-amber-500",
		report: "bg-rose-500"
	}[kind] ?? "bg-muted-foreground"}` });
}
function timeAgo(iso) {
	const diff = Date.now() - new Date(iso).getTime();
	const s = Math.floor(diff / 1e3);
	if (s < 60) return `${s}s ago`;
	const m = Math.floor(s / 60);
	if (m < 60) return `${m}m ago`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h ago`;
	return `${Math.floor(h / 24)}d ago`;
}
function RiskCell({ score, reasons }) {
	const color = score >= 70 ? "bg-red-500" : score >= 40 ? "bg-amber-500" : "bg-emerald-500";
	const label = score >= 70 ? "HIGH" : score >= 40 ? "MED" : "LOW";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-[140px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-2 w-2 rounded-full ${color}` }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm font-bold",
					children: score
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: "outline",
					className: "text-[10px] py-0 h-4",
					children: label
				})
			]
		}), reasons.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-1 space-y-0.5",
			children: [reasons.slice(0, 2).map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-[10px] text-muted-foreground flex items-center gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-2.5 w-2.5" }), r]
			}, i)), reasons.length > 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-[10px] text-muted-foreground",
				children: [
					"+",
					reasons.length - 2,
					" more"
				]
			})]
		})]
	});
}
function ReportActions({ report, onDone }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [action, setAction] = (0, import_react.useState)("dismiss");
	const [note, setNote] = (0, import_react.useState)("");
	const resolve = async () => {
		if (!confirm(`Apply "${action}" to this report?`)) return;
		const { error } = await supabase.rpc("admin_resolve_report", {
			_report_id: report.id,
			_action: action,
			_note: note || void 0
		});
		if (error) return toast.error(error.message);
		toast.success("Report resolved");
		setOpen(false);
		onDone();
	};
	if (report.status !== "open") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "outline",
		className: "capitalize",
		children: report.status
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "outline",
				children: "Resolve"
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Resolve report" }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Action" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: action,
					onValueChange: setAction,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "dismiss",
							children: "Dismiss"
						}),
						report.entity_type === "user" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "warn",
							children: "Warn user"
						}),
						report.entity_type === "listing" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "remove_listing",
							children: "Remove listing"
						}),
						report.entity_type === "user" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "suspend_user",
							children: "Suspend user"
						})
					] })]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Internal note (optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: note,
					onChange: (e) => setNote(e.target.value),
					rows: 3,
					placeholder: "Context for audit log…"
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: resolve,
				children: "Apply"
			}) })
		] })]
	});
}
function BroadcastPanel() {
	const [audience, setAudience] = (0, import_react.useState)("all");
	const [title, setTitle] = (0, import_react.useState)("");
	const [body, setBody] = (0, import_react.useState)("");
	const [link, setLink] = (0, import_react.useState)("");
	const [sending, setSending] = (0, import_react.useState)(false);
	const send = async () => {
		if (title.length < 2 || body.length < 2) return toast.error("Title and body required");
		if (!confirm(`Send broadcast to "${audience}" audience?`)) return;
		setSending(true);
		const { data, error } = await supabase.rpc("admin_broadcast", {
			_audience: audience,
			_title: title,
			_body: body,
			_link: link || void 0
		});
		setSending(false);
		if (error) return toast.error(error.message);
		toast.success(`Sent to ${data} users`);
		setTitle("");
		setBody("");
		setLink("");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "p-6 max-w-2xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 mb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-semibold text-lg",
				children: "Compose broadcast"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Audience" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: audience,
					onValueChange: setAudience,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "Everyone"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "verified",
							children: "Verified users"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "vip",
							children: "VIP subscribers"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "pro",
							children: "Pro subscribers"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "lite",
							children: "Lite subscribers"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "shops",
							children: "Shop owners"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "artisans",
							children: "Artisans"
						})
					] })]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Title" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: title,
					onChange: (e) => setTitle(e.target.value),
					placeholder: "Short, catchy headline",
					maxLength: 80
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Body" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: body,
					onChange: (e) => setBody(e.target.value),
					rows: 4,
					placeholder: "What do you want users to know?",
					maxLength: 500
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Link (optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: link,
					onChange: (e) => setLink(e.target.value),
					placeholder: "/dashboard"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: send,
					disabled: sending,
					className: "w-full",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-4 w-4 mr-2" }), sending ? "Sending…" : "Send broadcast"]
				})
			]
		})]
	});
}
function PlatformSettings({ initial, onSaved }) {
	const [s, setS] = (0, import_react.useState)({
		maintenance_mode: initial?.maintenance_mode ?? false,
		disable_registration: initial?.disable_registration ?? false,
		disable_posting: initial?.disable_posting ?? false,
		disable_payments: initial?.disable_payments ?? false,
		disable_withdrawals: initial?.disable_withdrawals ?? false,
		disable_messaging: initial?.disable_messaging ?? false,
		emergency_banner: initial?.emergency_banner ?? ""
	});
	(0, import_react.useEffect)(() => {
		if (initial) setS({
			maintenance_mode: initial.maintenance_mode,
			disable_registration: initial.disable_registration,
			disable_posting: initial.disable_posting,
			disable_payments: initial.disable_payments,
			disable_withdrawals: initial.disable_withdrawals,
			disable_messaging: initial.disable_messaging,
			emergency_banner: initial.emergency_banner ?? ""
		});
	}, [initial]);
	const save = async () => {
		if (!confirm("Apply platform settings now?")) return;
		const { error } = await supabase.rpc("admin_update_platform_settings", {
			_maintenance: s.maintenance_mode,
			_disable_registration: s.disable_registration,
			_disable_posting: s.disable_posting,
			_disable_payments: s.disable_payments,
			_disable_withdrawals: s.disable_withdrawals,
			_disable_messaging: s.disable_messaging,
			_banner: s.emergency_banner
		});
		if (error) return toast.error(error.message);
		toast.success("Platform settings updated");
		onSaved();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-4 max-w-3xl",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "p-6 border-destructive/40",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 mb-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, { className: "h-5 w-5 text-destructive" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-semibold text-lg",
						children: "Emergency controls"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground mb-4",
					children: "Changes apply platform-wide immediately. Every change is audit-logged."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						[
							[
								"maintenance_mode",
								"Maintenance mode",
								"Freeze all public actions and show a banner"
							],
							[
								"disable_registration",
								"Disable new signups",
								"Block new account creation"
							],
							[
								"disable_posting",
								"Disable new listings",
								"Block ad posting temporarily"
							],
							[
								"disable_payments",
								"Disable payments",
								"Block subscription and boost payments"
							],
							[
								"disable_withdrawals",
								"Freeze withdrawals",
								"Halt payouts pending review"
							],
							[
								"disable_messaging",
								"Disable messaging",
								"Freeze buyer↔seller chats"
							]
						].map(([key, label, desc]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-4 rounded-lg border p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium text-sm",
								children: label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: desc
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: s[key],
								onCheckedChange: (v) => setS((prev) => ({
									...prev,
									[key]: v
								}))
							})]
						}, key)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Emergency banner (shown site-wide when non-empty)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								value: s.emergency_banner,
								onChange: (e) => setS((prev) => ({
									...prev,
									emergency_banner: e.target.value
								})),
								rows: 2,
								placeholder: "e.g. Scheduled maintenance from 2am–3am WAT",
								className: "mt-1"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: save,
							className: "w-full bg-destructive hover:bg-destructive/90",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "h-4 w-4 mr-2" }), "Apply settings"]
						})
					]
				})
			]
		})
	});
}
function UserInspector({ id, onClose }) {
	const { data, isLoading } = useQuery({
		queryKey: ["admin-user-inspector", id],
		enabled: !!id,
		queryFn: async () => {
			const { data } = await supabase.rpc("admin_user_inspector", { _uid: id });
			return Array.isArray(data) ? data[0] : data;
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open: !!id,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			className: "w-full sm:max-w-lg overflow-y-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetTitle, {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserSearch, { className: "h-4 w-4" }), " User inspector"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetDescription, { children: "Deep dive into any user's activity" })] }),
				isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-16 text-center text-muted-foreground",
					children: "Loading…"
				}),
				data && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/70 grid place-items-center text-white text-xl font-bold",
								children: (data.full_name ?? "?").slice(0, 1).toUpperCase()
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-bold",
									children: data.full_name ?? "Anonymous"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: data.email ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-1 mt-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										className: "capitalize",
										children: data.subscription_tier
									}), data.is_verified && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
										className: "bg-emerald-500 text-white gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "h-3 w-3" }), "Verified"]
									})]
								})
							] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between mb-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs uppercase font-bold text-muted-foreground",
									children: "Trust score"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-lg font-extrabold",
									children: [data.trust_score, "/100"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
								value: data.trust_score,
								className: "h-2"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectStat, {
									label: "Listings",
									value: `${data.active_listings}/${data.listings_count}`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectStat, {
									label: "Chats",
									value: data.chats_count
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectStat, {
									label: "Reports against",
									value: data.reports_against,
									danger: data.reports_against > 0
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectStat, {
									label: "Wallet",
									value: formatNaira(data.wallet_balance)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectStat, {
									label: "Wallet txns",
									value: data.wallet_txns
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectStat, {
									label: "KYC",
									value: data.kyc_status
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectStat, {
									label: "Phone",
									value: data.phone ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectStat, {
									label: "State",
									value: data.state ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectStat, {
									label: "Shop",
									value: data.shop_slug ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectStat, {
									label: "Artisan",
									value: data.is_artisan ? "Yes" : "No"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectStat, {
									label: "Joined",
									value: timeAgo(data.created_at)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectStat, {
									label: "Sub. until",
									value: data.subscription_until ? new Date(data.subscription_until).toLocaleDateString() : "—"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pt-2 border-t space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-bold uppercase text-muted-foreground",
								children: "Quick actions"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "outline",
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										href: `mailto:${data.email}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LifeBuoy, { className: "h-3.5 w-3.5 mr-1" }), "Email"]
									})
								}), data.shop_slug && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "outline",
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: `/shop/${data.shop_slug}`,
										target: "_blank",
										rel: "noreferrer",
										children: "View shop"
									})
								})]
							})]
						})
					]
				})
			]
		})
	});
}
function InspectStat({ label, value, danger }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `rounded-lg border p-2.5 ${danger ? "border-destructive/50 bg-destructive/5" : ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[10px] uppercase font-bold text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: `text-sm font-semibold mt-0.5 ${danger ? "text-destructive" : ""}`,
			children: value
		})]
	});
}
//#endregion
export { Admin as component };
