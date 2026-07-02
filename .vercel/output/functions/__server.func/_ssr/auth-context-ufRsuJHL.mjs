import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-B0U85Udx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-context-ufRsuJHL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Ctx = (0, import_react.createContext)({
	user: null,
	session: null,
	profile: null,
	isAdmin: false,
	loading: true,
	signOut: async () => {},
	refreshProfile: async () => {}
});
function AuthProvider({ children }) {
	const [session, setSession] = (0, import_react.useState)(null);
	const [user, setUser] = (0, import_react.useState)(null);
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [isAdmin, setIsAdmin] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const loadProfile = async (uid) => {
		const [{ data: p }, { data: roles }] = await Promise.all([supabase.rpc("get_my_profile"), supabase.from("user_roles").select("role").eq("user_id", uid)]);
		setProfile((Array.isArray(p) ? p[0] : p) ?? null);
		setIsAdmin(!!roles?.some((r) => r.role === "admin"));
	};
	(0, import_react.useEffect)(() => {
		const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
			setSession(s);
			setUser(s?.user ?? null);
			if (s?.user) setTimeout(() => loadProfile(s.user.id), 0);
			else {
				setProfile(null);
				setIsAdmin(false);
			}
		});
		supabase.auth.getSession().then(({ data: { session: s } }) => {
			setSession(s);
			setUser(s?.user ?? null);
			if (s?.user) loadProfile(s.user.id).finally(() => setLoading(false));
			else setLoading(false);
		});
		return () => sub.subscription.unsubscribe();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ctx.Provider, {
		value: {
			user,
			session,
			profile,
			isAdmin,
			loading,
			signOut: async () => {
				await supabase.auth.signOut();
			},
			refreshProfile: async () => {
				if (user) await loadProfile(user.id);
			}
		},
		children
	});
}
var useAuth = () => (0, import_react.useContext)(Ctx);
//#endregion
export { useAuth as n, AuthProvider as t };
