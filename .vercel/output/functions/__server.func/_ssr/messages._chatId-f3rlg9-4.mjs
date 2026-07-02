import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-B0U85Udx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useAuth } from "./auth-context-ufRsuJHL.mjs";
import { t as Button } from "./button-DRsC1qZi.mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { D as Pin, S as Send, U as Image, ct as CheckCheck, h as Sparkles, st as Check, yt as ArrowLeft } from "../_libs/lucide-react.mjs";
import { t as SiteHeader } from "./site-header-Cke-4LQf.mjs";
import { t as getSignedUrl } from "./storage-BCLwX12s.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Input } from "./input-DicJzR9-.mjs";
import { t as Route } from "./messages._chatId-C-uYmxFI.mjs";
import { t as LoadingSpinner } from "./loading-spinner-R2T4_Xmi.mjs";
import { n as usePlan, t as hasCapability } from "./use-plan-ql2zu8lW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/messages._chatId-f3rlg9-4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PAGE = 50;
function ChatPage() {
	const { chatId } = Route.useParams();
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
	const { data: meta } = useQuery({
		queryKey: ["chat-meta", chatId],
		enabled: !!user,
		queryFn: async () => {
			const { data: c, error } = await supabase.from("chats").select("id,listing_id,buyer_id,seller_id").eq("id", chatId).maybeSingle();
			if (error || !c) return null;
			const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;
			const [{ data: l }, { data: p }] = await Promise.all([supabase.from("listings").select("title,images").eq("id", c.listing_id).maybeSingle(), supabase.from("profiles").select("id,full_name").eq("id", otherId).maybeSingle()]);
			return {
				...c,
				listing: l,
				other: p
			};
		}
	});
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [hasMore, setHasMore] = (0, import_react.useState)(true);
	const [loadingMsgs, setLoadingMsgs] = (0, import_react.useState)(true);
	const [text, setText] = (0, import_react.useState)("");
	const [sending, setSending] = (0, import_react.useState)(false);
	const [otherTyping, setOtherTyping] = (0, import_react.useState)(false);
	const bottomRef = (0, import_react.useRef)(null);
	const scrollRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!user) return;
		let alive = true;
		(async () => {
			setLoadingMsgs(true);
			const { data } = await supabase.from("messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: false }).limit(PAGE);
			if (!alive) return;
			setMessages((data ?? []).reverse());
			setHasMore((data?.length ?? 0) >= PAGE);
			setLoadingMsgs(false);
			await supabase.rpc("mark_chat_read", { _chat_id: chatId });
		})();
		return () => {
			alive = false;
		};
	}, [chatId, user]);
	(0, import_react.useEffect)(() => {
		if (!user) return;
		const ch = supabase.channel(`chat-room-${chatId}`, { config: { broadcast: { self: false } } }).on("postgres_changes", {
			event: "INSERT",
			schema: "public",
			table: "messages",
			filter: `chat_id=eq.${chatId}`
		}, (p) => {
			const m = p.new;
			setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
			if (m.sender_id !== user.id) supabase.rpc("mark_chat_read", { _chat_id: chatId });
		}).on("postgres_changes", {
			event: "UPDATE",
			schema: "public",
			table: "messages",
			filter: `chat_id=eq.${chatId}`
		}, (p) => {
			const m = p.new;
			setMessages((prev) => prev.map((x) => x.id === m.id ? m : x));
		}).on("broadcast", { event: "typing" }, (p) => {
			if (p.payload?.user_id && p.payload.user_id !== user.id) {
				setOtherTyping(true);
				setTimeout(() => setOtherTyping(false), 2500);
			}
		}).subscribe();
		return () => {
			supabase.removeChannel(ch);
		};
	}, [chatId, user]);
	(0, import_react.useEffect)(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length, otherTyping]);
	const loadOlder = async () => {
		if (!messages.length || !hasMore) return;
		const oldest = messages[0].created_at;
		const { data } = await supabase.from("messages").select("*").eq("chat_id", chatId).lt("created_at", oldest).order("created_at", { ascending: false }).limit(PAGE);
		const more = (data ?? []).reverse();
		setMessages((prev) => [...more, ...prev]);
		setHasMore((data?.length ?? 0) >= PAGE);
	};
	const typingChannelRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		typingChannelRef.current = supabase.channel(`chat-room-${chatId}`);
		return () => {
			if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current);
		};
	}, [chatId]);
	const onTyping = (v) => {
		setText(v);
		if (typingChannelRef.current && user) typingChannelRef.current.send({
			type: "broadcast",
			event: "typing",
			payload: { user_id: user.id }
		});
	};
	const send = async (e) => {
		e?.preventDefault();
		if (!user) return;
		const body = text.trim();
		if (!body) return;
		setSending(true);
		const { error } = await supabase.from("messages").insert({
			chat_id: chatId,
			sender_id: user.id,
			content: body
		});
		setSending(false);
		if (error) return toast.error(error.message);
		setText("");
	};
	if (loading || loadingMsgs) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingSpinner, { label: "Loading chat…" })]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background flex flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatHeader, {
				meta,
				plan
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: scrollRef,
				className: "flex-1 overflow-y-auto bg-muted/30",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto px-3 py-4 max-w-2xl space-y-2",
					children: [
						hasMore && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "sm",
								onClick: loadOlder,
								children: "Load older messages"
							})
						}),
						messages.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center text-sm text-muted-foreground py-8",
							children: "Say hi to start the conversation 👋"
						}),
						messages.map((m) => {
							const mine = m.sender_id === user?.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `flex ${mine ? "justify-end" : "justify-start"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border rounded-bl-sm"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "whitespace-pre-wrap break-words",
										children: m.content
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `flex items-center gap-1 mt-1 text-[10px] ${mine ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: new Date(m.created_at).toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit"
										}) }), mine && (m.read_at ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, { className: "h-3 w-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3" }))]
									})]
								})
							}, m.id);
						}),
						otherTyping && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex justify-start",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "bg-card border rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-muted-foreground italic",
								children: "typing…"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: bottomRef })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
				onSubmit: send,
				className: "border-t bg-background p-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto max-w-2xl flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: text,
						onChange: (e) => onTyping(e.target.value),
						placeholder: "Type a message…",
						disabled: sending,
						autoFocus: true
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: sending || !text.trim(),
						className: "bg-accent text-accent-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-4 w-4" })
					})]
				})
			})
		]
	});
}
function ChatHeader({ meta, plan }) {
	const [img, setImg] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const first = meta?.listing?.images?.[0];
		if (first) getSignedUrl(first).then(setImg);
	}, [meta?.listing?.images]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "border-b bg-background sticky top-0 z-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "container mx-auto max-w-2xl px-3 py-2 flex items-center gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "ghost",
					size: "icon",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/messages",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-5 w-5" })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-10 w-10 rounded-lg bg-muted overflow-hidden grid place-items-center shrink-0",
					children: img ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: img,
						alt: "",
						className: "h-full w-full object-cover"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "h-4 w-4 text-muted-foreground" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 min-w-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold truncate",
							children: meta?.other?.full_name ?? "User"
						}),
						meta?.listing_id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/listing/$id",
							params: { id: meta.listing_id },
							className: "text-xs text-accent truncate block",
							children: meta?.listing?.title ?? "View listing"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5",
							children: hasCapability(plan, "premium_inbox") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3 w-3" }), " Premium inbox"]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "h-3 w-3" }), " Pinned chats ready"]
							})
						})
					]
				})
			]
		})
	});
}
//#endregion
export { ChatPage as component };
