import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { gt as Award } from "../_libs/lucide-react.mjs";
import { t as Badge } from "./badge-Cc0IblCb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tier-badge-iAgvCeGM.js
var import_jsx_runtime = require_jsx_runtime();
function TierBadge({ tier }) {
	if (!tier || tier === "free") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
		className: `${tier === "vip" ? "bg-amber-500 text-black" : tier === "pro" ? "bg-violet-500 text-white" : "bg-emerald-500 text-white"} uppercase gap-1`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, { className: "h-3 w-3" }), tier]
	});
}
//#endregion
export { TierBadge as t };
