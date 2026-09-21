import { supabase } from "@/integrations/supabase/client";

/**
 * The waitlist RPCs live in the production database and are not part of the
 * generated type map, so they are called through this thin, explicitly typed
 * wrapper instead of scattering casts across the page.
 */
export async function waitlistRpc(
  fn: string,
  args?: Record<string, unknown>,
): Promise<unknown> {
  const call = supabase.rpc as unknown as (
    name: string,
    params?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  const { data, error } = await call(fn, args);
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Same escape hatch, but keeps the familiar `{ data, error }` shape for call
 * sites that already handle the error inline.
 */
export function rpcUntyped(
  fn: string,
  args?: Record<string, unknown>,
): Promise<{ data: unknown; error: { message: string } | null }> {
  const call = supabase.rpc as unknown as (
    name: string,
    params?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
  return call(fn, args);
}
