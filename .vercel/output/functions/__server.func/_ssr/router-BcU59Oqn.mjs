import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as AuthProvider } from "./auth-context-ufRsuJHL.mjs";
import { A as redirect, c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, m as createFileRoute, p as lazyRouteComponent, s as Scripts, v as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { n as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { a as objectType, n as coerce, o as stringType, r as enumType, t as booleanType } from "../_libs/zod.mjs";
import { t as Route$14 } from "./listing._id-BO_8zagV.mjs";
import { t as Route$15 } from "./messages._chatId-C-uYmxFI.mjs";
import { t as Route$16 } from "./routes-KHDnuILI.mjs";
import { t as Route$17 } from "./shop._slug-D3W2W2c4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BcU59Oqn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-Oto7XEF6.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
}
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$13 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Lovable App" },
			{
				name: "description",
				content: "Tile is a dual-sided marketplace for buying and selling goods, and hiring services."
			},
			{
				name: "author",
				content: "Lovable"
			},
			{
				property: "og:title",
				content: "Lovable App"
			},
			{
				property: "og:description",
				content: "Tile is a dual-sided marketplace for buying and selling goods, and hiring services."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary"
			},
			{
				name: "twitter:site",
				content: "@Lovable"
			},
			{
				name: "twitter:title",
				content: "Lovable App"
			},
			{
				name: "twitter:description",
				content: "Tile is a dual-sided marketplace for buying and selling goods, and hiring services."
			},
			{
				property: "og:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8e28c15f-e7fc-4628-bec3-69ea2035aec8/id-preview-99a33a6e--3605a032-1474-409c-a42f-c09c419bdd79.lovable.app-1781287396188.png"
			},
			{
				name: "twitter:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8e28c15f-e7fc-4628-bec3-69ea2035aec8/id-preview-99a33a6e--3605a032-1474-409c-a42f-c09c419bdd79.lovable.app-1781287396188.png"
			}
		],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$13.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {
			richColors: true,
			position: "top-right"
		})] })
	});
}
var $$splitComponentImporter$11 = () => import("./verify-email-eo1x8GW8.mjs");
var Route$12 = createFileRoute("/verify-email")({
	head: () => ({ meta: [{ title: "Verify your email — Tile" }] }),
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitComponentImporter$10 = () => import("./signup-CRHWXwFY.mjs");
var Route$11 = createFileRoute("/signup")({
	head: () => ({ meta: [{ title: "Create your Tile account" }, {
		name: "description",
		content: "Join Nigeria's marketplace. Buy, sell goods, or offer services in minutes."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./reset-password-B01w9_90.mjs");
var Route$10 = createFileRoute("/reset-password")({
	head: () => ({ meta: [{ title: "Set a new password — Tile" }] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./post-ad-DK0-2KH_.mjs");
var Route$9 = createFileRoute("/post-ad")({
	head: () => ({ meta: [{ title: "Post an Ad — Tile" }] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
objectType({
	category: stringType().min(1, "Choose a category"),
	title: stringType().min(5, "Title is too short").max(120),
	description: stringType().min(20, "Tell buyers more").max(2e3),
	state_id: stringType().min(1, "Please select a state"),
	lga_id: stringType().min(1, "Please select an LGA"),
	phone: stringType().min(7),
	price: coerce.number().positive().optional(),
	condition: enumType([
		"new",
		"used_like_new",
		"used_good",
		"used_fair"
	]).optional(),
	brand: stringType().optional()
});
var $$splitComponentImporter$7 = () => import("./messages-DiZHpErc.mjs");
var Route$8 = createFileRoute("/messages")({
	head: () => ({ meta: [{ title: "Messages — Tile" }] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./login-whgUCk3n.mjs");
var Route$7 = createFileRoute("/login")({
	head: () => ({ meta: [{ title: "Sign in — Tile" }, {
		name: "description",
		content: "Sign in to your Tile account to manage your shop, listings and messages."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./forgot-password-ByR-m0Cz.mjs");
var Route$6 = createFileRoute("/forgot-password")({
	head: () => ({ meta: [{ title: "Reset your password — Tile" }] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./dashboard-_AJZgj9u.mjs");
var Route$5 = createFileRoute("/dashboard")({
	head: () => ({ meta: [{ title: "Dashboard — Tile" }] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var Route$4 = createFileRoute("/auth")({ beforeLoad: () => {
	throw redirect({ to: "/login" });
} });
var $$splitComponentImporter$3 = () => import("./admin-CZL3pT8D.mjs");
var Route$3 = createFileRoute("/admin")({
	head: () => ({ meta: [{ title: "Admin Cabin — Tile" }] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./messages.index-DBjnFq94.mjs");
var Route$2 = createFileRoute("/messages/")({
	head: () => ({ meta: [{ title: "Inbox — Tile" }] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./artisans-CcfBKyb_.mjs");
var Route$1 = createFileRoute("/artisans/")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./create-D_dTJZr3.mjs");
var Route = createFileRoute("/artisan/create")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
objectType({
	full_name: stringType().min(2, "Enter your full name"),
	profession: stringType().min(1, "Select your profession"),
	bio: stringType().min(30, "Tell customers about yourself (minimum 30 characters)").max(500, "Bio is too long"),
	phone: stringType().min(10, "Enter a valid phone number"),
	whatsapp: stringType().optional(),
	state: stringType().min(1, "Select a state"),
	lga: stringType().min(1, "Select an LGA"),
	years_experience: coerce.number().min(0).max(80),
	is_available: booleanType(),
	starting_price: coerce.number().optional(),
	offers_home_service: booleanType(),
	offers_emergency_service: booleanType(),
	available_weekends: booleanType()
});
var VerifyEmailRoute = Route$12.update({
	id: "/verify-email",
	path: "/verify-email",
	getParentRoute: () => Route$13
});
var SignupRoute = Route$11.update({
	id: "/signup",
	path: "/signup",
	getParentRoute: () => Route$13
});
var ResetPasswordRoute = Route$10.update({
	id: "/reset-password",
	path: "/reset-password",
	getParentRoute: () => Route$13
});
var PostAdRoute = Route$9.update({
	id: "/post-ad",
	path: "/post-ad",
	getParentRoute: () => Route$13
});
var MessagesRoute = Route$8.update({
	id: "/messages",
	path: "/messages",
	getParentRoute: () => Route$13
});
var LoginRoute = Route$7.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$13
});
var ForgotPasswordRoute = Route$6.update({
	id: "/forgot-password",
	path: "/forgot-password",
	getParentRoute: () => Route$13
});
var DashboardRoute = Route$5.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => Route$13
});
var AuthRoute = Route$4.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$13
});
var AdminRoute = Route$3.update({
	id: "/admin",
	path: "/admin",
	getParentRoute: () => Route$13
});
var IndexRoute = Route$16.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$13
});
var MessagesIndexRoute = Route$2.update({
	id: "/",
	path: "/",
	getParentRoute: () => MessagesRoute
});
var ArtisansIndexRoute = Route$1.update({
	id: "/artisans/",
	path: "/artisans/",
	getParentRoute: () => Route$13
});
var ShopSlugRoute = Route$17.update({
	id: "/shop/$slug",
	path: "/shop/$slug",
	getParentRoute: () => Route$13
});
var MessagesChatIdRoute = Route$15.update({
	id: "/$chatId",
	path: "/$chatId",
	getParentRoute: () => MessagesRoute
});
var ListingIdRoute = Route$14.update({
	id: "/listing/$id",
	path: "/listing/$id",
	getParentRoute: () => Route$13
});
var ArtisanCreateRoute = Route.update({
	id: "/artisan/create",
	path: "/artisan/create",
	getParentRoute: () => Route$13
});
var MessagesRouteChildren = {
	MessagesChatIdRoute,
	MessagesIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	AdminRoute,
	AuthRoute,
	DashboardRoute,
	ForgotPasswordRoute,
	LoginRoute,
	MessagesRoute: MessagesRoute._addFileChildren(MessagesRouteChildren),
	PostAdRoute,
	ResetPasswordRoute,
	SignupRoute,
	VerifyEmailRoute,
	ArtisanCreateRoute,
	ListingIdRoute,
	ShopSlugRoute,
	ArtisansIndexRoute
};
var routeTree = Route$13._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
