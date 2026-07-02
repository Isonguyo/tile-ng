import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn } from "./button-DRsC1qZi.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as Sparkles, y as ShieldCheck, yt as ArrowLeft } from "../_libs/lucide-react.mjs";
import { t as Card } from "./card-BLWafi8D.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-layout-jFihKfkU.js
var import_jsx_runtime = require_jsx_runtime();
/**
* Map Supabase auth error messages to friendly, user-facing copy.
*/
function friendlyAuthError(message) {
	if (!message) return "Something went wrong. Please try again.";
	const m = message.toLowerCase();
	if (m.includes("invalid login") || m.includes("invalid_grant") || m.includes("wrong password")) return "Invalid login credentials. Please try again or reset your password.";
	if (m.includes("email not confirmed") || m.includes("email_confirm")) return "Please verify your email before signing in.";
	if (m.includes("user already registered") || m.includes("already registered") || m.includes("email already exists")) return "That email is already registered. Try signing in instead.";
	if (m.includes("password should be at least") || m.includes("password is too weak") || m.includes("weak password")) return "Password is too weak. Add more characters and a mix of letters, numbers, and symbols.";
	if (m.includes("verification") && m.includes("expired")) return "The verification link has expired. Request a new one.";
	if (m.includes("rate limit") || m.includes("too many") || m.includes("forbidden")) return "Too many attempts. Please wait a moment and try again.";
	if (m.includes("pwned") || m.includes("compromised")) return "That password has appeared in a data breach. Please choose a stronger one.";
	if (m.includes("network") || m.includes("fetch")) return "Network issue. Check your connection and retry.";
	if (m.includes("not authenticated")) return "Please sign in to continue.";
	return message.charAt(0).toUpperCase() + message.slice(1);
}
var trustPoints = [
	"Secure authentication",
	"Encrypted with Supabase",
	"Trusted by Nigerian businesses",
	"Buyer & seller protection"
];
function AuthLayout({ title, description, children, backTo = "/login", backLabel = "Back to sign in", compact = false, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.16),_transparent_25%)] px-4 py-8 sm:px-6 lg:px-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full lg:max-w-[470px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-3 py-2 text-sm font-semibold shadow-sm backdrop-blur",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground",
						children: "T"
					}), "Tile Marketplace"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 rounded-[2rem] border border-border/70 bg-background/80 p-6 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-sm font-semibold text-primary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-4 w-4" }), "Trusted authentication"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-4 text-3xl font-black tracking-tight sm:text-4xl",
							children: title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm leading-6 text-muted-foreground sm:text-base",
							children: description
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-6 space-y-3 text-sm text-foreground/90",
							children: trustPoints.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4 text-primary" }), item]
							}, item))
						})
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "w-full lg:flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: cn("mx-auto w-full max-w-xl border-border/70 bg-background/85 p-6 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-8", compact && "max-w-lg", className),
					children: [backTo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: backTo,
						className: "mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" }), backLabel]
					}) : null, children]
				})
			})]
		})
	});
}
//#endregion
export { friendlyAuthError as n, AuthLayout as t };
