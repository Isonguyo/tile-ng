import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-B0U85Udx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useAuth } from "./auth-context-ufRsuJHL.mjs";
import { n as cn, t as Button } from "./button-DRsC1qZi.mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { $ as Copy, H as KeyRound, Y as Flag, b as ShieldAlert, f as Tag, ht as BadgeCheck, l as TriangleAlert, o as Users, pt as Banknote, r as X, st as Check } from "../_libs/lucide-react.mjs";
import { t as SiteHeader } from "./site-header-Cke-4LQf.mjs";
import { t as Card } from "./card-BLWafi8D.mjs";
import { t as Badge } from "./badge-Cc0IblCb.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-BYfOmXtJ.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, o as DialogTrigger, r as DialogFooter, t as Dialog } from "./dialog-DFjnKMNx.mjs";
import { t as Textarea } from "./textarea-DBn9CRiI.mjs";
import { r as formatNaira } from "./categories-j3aLXACs.mjs";
import { n as getSignedUrls } from "./storage-BCLwX12s.mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-CZL3pT8D.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
function Admin() {
	const { isAdmin, loading } = useAuth();
	const nav = useNavigate();
	const qc = useQueryClient();
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
	const { data: pending = [] } = useQuery({
		queryKey: ["pending"],
		enabled: isAdmin,
		queryFn: async () => {
			const { data } = await supabase.rpc("admin_pending_listings");
			return data ?? [];
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
		qc.invalidateQueries({ queryKey: ["pending"] });
	};
	const reject = async (id, reason) => {
		const { error } = await supabase.rpc("admin_reject_listing", {
			_id: id,
			_reason: reason
		});
		if (error) return toast.error(error.message);
		toast.success("Rejected");
		qc.invalidateQueries({ queryKey: ["pending"] });
	};
	const flag = async (id) => {
		const { error } = await supabase.rpc("admin_flag_seller", { _listing_id: id });
		if (error) return toast.error(error.message);
		toast.success("Seller flagged & listing removed");
		qc.invalidateQueries({ queryKey: ["pending"] });
	};
	const grantVerified = async (id) => {
		await supabase.from("profiles").update({
			kyc_status: "verified",
			is_verified: true
		}).eq("id", id);
		toast.success("Verified badge granted");
		qc.invalidateQueries({ queryKey: ["kyc-pending"] });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "container mx-auto px-4 py-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "text-2xl md:text-3xl font-bold flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "text-accent" }), " Admin Cabin"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground",
					children: "Global platform command console"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
							label: "Users",
							value: stats?.users ?? 0,
							icon: Users
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
							label: "Active Ads",
							value: stats?.ads ?? 0,
							icon: Tag
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
							label: "Total Revenue",
							value: formatNaira(stats?.revenue ?? 0),
							icon: Banknote
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
							label: "Active Subscribers",
							value: stats?.active ?? 0,
							icon: BadgeCheck
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] uppercase text-muted-foreground font-bold",
								children: "Monthly Revenue"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-lg font-extrabold",
								children: formatNaira(stats?.monthly ?? 0)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] uppercase text-muted-foreground font-bold",
								children: "Yearly Revenue"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-lg font-extrabold",
								children: formatNaira(stats?.yearly ?? 0)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] uppercase text-muted-foreground font-bold",
								children: "Lite Active"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-lg font-extrabold",
								children: stats?.lite ?? 0
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] uppercase text-muted-foreground font-bold",
								children: "Pro Active"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-lg font-extrabold",
								children: stats?.pro ?? 0
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] uppercase text-muted-foreground font-bold",
								children: "VIP Active"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-lg font-extrabold",
								children: stats?.vip ?? 0
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
					defaultValue: "moderation",
					className: "w-full",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-x-auto scrollbar-hide pb-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
								className: "inline-flex w-max min-w-full md:min-w-0 gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
										value: "moderation",
										className: "whitespace-nowrap",
										children: "Ad Moderation"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
										value: "kyc",
										className: "whitespace-nowrap",
										children: "KYC Audit"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
										value: "money",
										className: "whitespace-nowrap",
										children: "Monetization"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
										value: "users",
										className: "whitespace-nowrap",
										children: "Users"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
										value: "codes",
										className: "whitespace-nowrap",
										children: "Admin Codes"
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "moderation",
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								className: "p-0 overflow-x-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Title" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Seller" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Type" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Price" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Category" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
										className: "text-right",
										children: "Actions"
									})
								] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [pending.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									colSpan: 5,
									className: "text-center text-muted-foreground py-8",
									children: "No pending ads"
								}) }), pending.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "font-medium",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PendingTitle, { l })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
										className: "text-sm",
										children: [
											l.seller_name ?? "—",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-muted-foreground",
												children: l.seller_phone ?? ""
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										className: "capitalize",
										children: l.type
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: formatNaira(l.price) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-xs",
										children: l.category
									}),
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
							})
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
										children: p.full_name
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
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "money",
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
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
								] }, t.id))] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-4 text-xs text-muted-foreground border-t",
									children: [
										"Plan prices: Lite ₦5,000 · Pro ₦15,000 · VIP ₦40,000 (edit in ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "activate_subscription" }),
										" SQL function)."
									]
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "users",
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								className: "p-0 overflow-x-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Name" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Email" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Tier" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "KYC" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
										className: "text-right",
										children: "Active Ads"
									})
								] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [users.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									colSpan: 5,
									className: "text-center text-muted-foreground py-8",
									children: "No users"
								}) }), users.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "font-medium",
										children: u.full_name ?? "—"
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
								] }, u.id))] })] })
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
				})
			]
		})]
	});
}
function StatCard({ label, value, icon: Icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
		className: "p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-primary-foreground/70 uppercase tracking-wide",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-3xl font-extrabold mt-1",
				children: value
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-10 w-10 opacity-60" })]
		})
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
//#endregion
export { Admin as component };
