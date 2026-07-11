import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-B0U85Udx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useAuth } from "./auth-context-ufRsuJHL.mjs";
import { t as Card } from "./card-CzXpCsbD.mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as Pin, I as MessageCircle, J as Image, _ as Sparkles } from "../_libs/lucide-react.mjs";
import { t as SiteHeader } from "./site-header-DuVnqON_.mjs";
import { t as Badge } from "./badge-D1Dupn2y.mjs";
import { t as getSignedUrl } from "./storage-BCLwX12s.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as LoadingSpinner } from "./loading-spinner-R2T4_Xmi.mjs";
import { n as usePlan, t as hasCapability } from "./use-plan-ql2zu8lW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/messages.index-BTRen9KB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function InboxPage() {
	const { user, loading } = useAuth();
	const nav = useNavigate();
	const { data: plan } = usePlan();
	(0, import_react.useEffect)(() => {
		if (!loading && !user) nav({ to: "/auth" });
	}, [
		user,
		loading,
		nav
	]);
	const { data: chats = [], isLoading, refetch } = useQuery({
		queryKey: ["my-chats", user?.id],
		enabled: !!user,
		queryFn: async () => {
			const { data, error } = await supabase.rpc("my_chats");
			if (error) throw error;
			return data ?? [];
		}
	});
	(0, import_react.useEffect)(() => {
		if (!user) return;
		const ch = supabase.channel(`inbox-${user.id}`).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "messages"
		}, () => refetch()).on("postgres_changes", {
			event: "INSERT",
			schema: "public",
			table: "chats"
		}, () => refetch()).subscribe();
		return () => {
			supabase.removeChannel(ch);
		};
	}, [user, refetch]);
	if (loading || isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingSpinner, { label: "Loading inbox…" })]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "container mx-auto px-4 py-6 max-w-3xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3 mb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "text-2xl font-bold flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-6 w-6" }), "Inbox"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground mt-1",
					children: "A premium marketplace inbox with pinned conversations and smarter handoffs."
				})] }), hasCapability(plan, "premium_inbox") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					className: "bg-accent text-accent-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "mr-1 h-3 w-3" }), " Premium inbox"]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: "secondary",
					children: "Standard inbox"
				})]
			}), chats.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "p-12 text-center text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-12 w-12 mx-auto mb-3 opacity-50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No conversations yet. Browse listings and message a vendor to get started." })]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: chats.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatRowItem, { c }, c.id))
			})]
		})]
	});
}
function ChatRowItem({ c }) {
	const [img, setImg] = (0, import_react.useState)(null);
	const [pinned, setPinned] = (0, import_react.useState)(Boolean(c.pinned_at));
	(0, import_react.useEffect)(() => {
		if (c.listing_image) getSignedUrl(c.listing_image).then(setImg);
	}, [c.listing_image]);
	const t = c.last_message_at ? new Date(c.last_message_at) : null;
	const time = t ? Date.now() - t.getTime() < 864e5 ? t.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit"
	}) : t.toLocaleDateString() : "";
	const togglePin = async (e) => {
		e.preventDefault();
		e.stopPropagation();
		const { data, error } = await supabase.rpc("toggle_chat_pin", { _chat_id: c.id });
		if (error) return toast.error(error.message);
		setPinned(Boolean(data));
		toast.success(data ? "Conversation pinned" : "Conversation unpinned");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/messages/$chatId",
		params: { chatId: c.id },
		className: "block",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: `p-3 flex gap-3 items-center hover:bg-muted/50 transition-colors ${pinned ? "border-accent/40" : ""}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-14 w-14 rounded-lg bg-muted shrink-0 overflow-hidden grid place-items-center",
				children: img ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: img,
					alt: "",
					className: "h-full w-full object-cover"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "h-5 w-5 text-muted-foreground" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between items-baseline gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold truncate",
								children: c.other_name ?? "User"
							}), pinned && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "h-3.5 w-3.5 text-accent shrink-0" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground shrink-0",
							children: time
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground truncate",
						children: c.listing_title ?? "Listing"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between items-center gap-2 mt-0.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-foreground/80 truncate",
							children: c.last_message ?? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "italic text-muted-foreground",
								children: "No messages yet"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 shrink-0",
							children: [c.unread_count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								className: "bg-accent text-accent-foreground",
								children: c.unread_count
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: togglePin,
								className: "rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: `h-3.5 w-3.5 ${pinned ? "fill-current" : ""}` })
							})]
						})]
					})
				]
			})]
		})
	});
}
//#endregion
export { InboxPage as component };
