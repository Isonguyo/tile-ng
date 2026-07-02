import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-B0U85Udx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useAuth } from "./auth-context-ufRsuJHL.mjs";
import { t as Button } from "./button-DRsC1qZi.mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { I as MailCheck, z as LoaderCircle } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as friendlyAuthError, t as AuthLayout } from "./auth-layout-jFihKfkU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/verify-email-eo1x8GW8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function VerifyEmailPage() {
	const nav = useNavigate();
	const { user } = useAuth();
	const [cooldown, setCooldown] = (0, import_react.useState)(0);
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!cooldown) return;
		const t = window.setTimeout(() => setCooldown((c) => c - 1), 1e3);
		return () => window.clearTimeout(t);
	}, [cooldown]);
	(0, import_react.useEffect)(() => {
		const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
			if (event === "SIGNED_IN" && session?.user?.email_confirmed_at) nav({ to: "/dashboard" });
		});
		return () => sub.subscription.unsubscribe();
	}, [nav]);
	const resend = async () => {
		if (!user?.email) {
			toast.error("No email on file. Sign up again or contact support.");
			return;
		}
		setBusy(true);
		const { error } = await supabase.auth.resend({
			type: "signup",
			email: user.email
		});
		setBusy(false);
		if (error) {
			toast.error(friendlyAuthError(error.message));
			return;
		}
		toast.success("Verification email sent.");
		setCooldown(60);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthLayout, {
		title: "Verify your email",
		description: "We’ve sent a confirmation link to your inbox so you can secure your Tile account.",
		backTo: "/login",
		backLabel: "Back to login",
		compact: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl border border-border/70 bg-background/70 p-5 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MailCheck, { className: "h-8 w-8" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted-foreground",
					children: user?.email ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"We sent a confirmation link to ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-foreground",
							children: user.email
						}),
						"."
					] }) : "Check your inbox for the confirmation link from Tile."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-col gap-2 sm:flex-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: resend,
						disabled: busy || cooldown > 0,
						className: "w-full sm:w-auto",
						children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : null, cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "outline",
						className: "w-full sm:w-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							children: "Back to login"
						})
					})]
				})
			]
		})
	});
}
//#endregion
export { VerifyEmailPage as component };
