import { supabase } from "@/integrations/supabase/client";

export async function uploadListingImages(
  userId: string,
  files: File[],
  onProgress?: (uploaded: number, total: number) => void,
): Promise<string[]> {
  const paths: string[] = [];
  for (const [index, file] of files.entries()) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("listings").upload(path, file, { upsert: false });
    if (error) throw error;
    paths.push(path);
    onProgress?.(index + 1, files.length);
  }
  return paths;
}

export async function getSignedUrls(paths: string[]): Promise<string[]> {
  if (!paths.length) return [];
  const objectPaths = paths.map((path) => {
    const legacy = path.match(/\/storage\/v1\/object\/(?:public|sign)\/listings\/(.+?)(?:\?.*)?$/i);
    return legacy ? decodeURIComponent(legacy[1]) : path;
  });
  const needsSigning = objectPaths.map((path, index) => ({ path, index })).filter(({ path, index }) =>
    path === paths[index] ? !/^(?:https?:\/\/|\/\/|data:image\/|blob:)/i.test(path) : true,
  );
  const signed = new Map<number, string>();
  paths.forEach((path, index) => {
    if (/^(?:https?:\/\/|\/\/|data:image\/|blob:)/i.test(path) && objectPaths[index] === path) signed.set(index, path);
  });
  if (!needsSigning.length) return paths.map((_, index) => signed.get(index) ?? "");
  const chunks: typeof needsSigning[] = [];
  for (let index = 0; index < needsSigning.length; index += 100) chunks.push(needsSigning.slice(index, index + 100));
  const results = await Promise.all(chunks.map(async (chunk) => {
    const { data, error } = await supabase.storage.from("listings").createSignedUrls(chunk.map(({ path }) => path), 60 * 60);
    return { chunk, data: error ? null : data };
  }));
  results.forEach(({ chunk, data }) => chunk.forEach(({ index, path }, offset) => {
    const result = data?.find((item) => item.path === path) ?? data?.[offset];
    if (result?.signedUrl) signed.set(index, result.signedUrl);
  }));
  return paths.map((_, index) => signed.get(index) ?? "");
}

export async function getSignedUrl(path: string): Promise<string | null> {
  const legacyStorageUrl = path.match(/\/storage\/v1\/object\/(?:public|sign)\/listings\/(.+?)(?:\?.*)?$/i);
  const objectPath = legacyStorageUrl ? decodeURIComponent(legacyStorageUrl[1]) : path;
  if (!legacyStorageUrl && /^(?:https?:\/\/|\/\/|data:image\/|blob:)/i.test(path)) return path;
  const { data } = await supabase.storage.from("listings").createSignedUrl(objectPath, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function uploadKyc(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("kyc").upload(path, file);
  if (error) throw error;
  return path;
}
