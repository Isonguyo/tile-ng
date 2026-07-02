import { t as supabase } from "./client-B0U85Udx.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-DRsC1qZi.mjs";
import { _ as useNavigate, l as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { nt as Chromium, z as LoaderCircle } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/oauth-buttons-BxN_vBQE.js
var import_jsx_runtime = require_jsx_runtime();
function OAuthButtons({ disabled = false }) {
	const navigate = useNavigate();
	const location = useRouterState({ select: (s) => s.location });
	const handleGoogle = async () => {
		const redirectTo = typeof window !== "undefined" ? `${window.location.origin}${location.pathname}${location.search}` : void 0;
		const { error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo,
				queryParams: {
					access_type: "offline",
					prompt: "consent"
				}
			}
		});
		if (error) {
			toast.error("Google sign-in could not be started. Please try again.");
			return;
		}
		navigate({ to: "/dashboard" });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-3",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			type: "button",
			variant: "outline",
			className: "w-full",
			onClick: handleGoogle,
			disabled,
			children: [disabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chromium, { className: "mr-2 h-4 w-4" }), "Continue with Google"]
		})
	});
}
//#endregion
export { OAuthButtons as t };
