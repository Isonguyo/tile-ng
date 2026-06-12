import { supabase } from "@/integrations/supabase/client";

export async function uploadListingImages(userId: string, files: File[]): Promise<string[]> {
  const paths: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("listings").upload(path, file, { upsert: false });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

export async function getSignedUrls(paths: string[]): Promise<string[]> {
  if (!paths.length) return [];
  const { data, error } = await supabase.storage.from("listings").createSignedUrls(paths, 60 * 60);
  if (error) return [];
  return data.map((d) => d.signedUrl).filter((u): u is string => !!u);
}

export async function getSignedUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("listings").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function uploadKyc(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("kyc").upload(path, file);
  if (error) throw error;
  return path;
}