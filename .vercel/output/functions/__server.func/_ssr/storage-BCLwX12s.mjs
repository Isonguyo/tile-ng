import { t as supabase } from "./client-B0U85Udx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/storage-BCLwX12s.js
async function uploadListingImages(userId, files) {
	const paths = [];
	for (const file of files) {
		const ext = file.name.split(".").pop() ?? "jpg";
		const path = `${userId}/${crypto.randomUUID()}.${ext}`;
		const { error } = await supabase.storage.from("listings").upload(path, file, { upsert: false });
		if (error) throw error;
		paths.push(path);
	}
	return paths;
}
async function getSignedUrls(paths) {
	if (!paths.length) return [];
	const { data, error } = await supabase.storage.from("listings").createSignedUrls(paths, 3600);
	if (error) return [];
	return data.map((d) => d.signedUrl).filter((u) => !!u);
}
async function getSignedUrl(path) {
	const { data } = await supabase.storage.from("listings").createSignedUrl(path, 3600);
	return data?.signedUrl ?? null;
}
async function uploadKyc(userId, file) {
	const ext = file.name.split(".").pop() ?? "jpg";
	const path = `${userId}/${crypto.randomUUID()}.${ext}`;
	const { error } = await supabase.storage.from("kyc").upload(path, file);
	if (error) throw error;
	return path;
}
//#endregion
export { uploadListingImages as i, getSignedUrls as n, uploadKyc as r, getSignedUrl as t };
