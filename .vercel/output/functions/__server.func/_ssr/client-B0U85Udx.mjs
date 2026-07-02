import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-B0U85Udx.js
function createSupabaseClient() {
	return createClient("https://xhhyfpfizzrffbdyykra.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaHlmcGZpenpyZmZiZHl5a3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzY5NTMsImV4cCI6MjA5Njg1Mjk1M30.KMhDSU2ziiCezToU3isoqj3ANDLy2zCI-7nG6YEb9ZE", { auth: {
		storage: typeof window !== "undefined" ? localStorage : void 0,
		persistSession: true,
		autoRefreshToken: true,
		flowType: "pkce"
	} });
}
var _supabase;
var supabase = new Proxy({}, { get(_, prop, receiver) {
	if (!_supabase) _supabase = createSupabaseClient();
	return Reflect.get(_supabase, prop, receiver);
} });
//#endregion
export { supabase as t };
