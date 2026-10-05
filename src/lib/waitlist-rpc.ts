import { supabase } from "@/integrations/supabase/client";

/* eslint-disable @typescript-eslint/no-explicit-any */

type RpcResult = { data: unknown; error: { message: string } | null };

/**
 * The waitlist RPCs live in the production database and are not part of the
 * generated type map, so they are called through this thin, explicitly typed
 * wrapper instead of scattering casts across the page.
 *
 * The call must stay a method call on the client — pulling `rpc` off the
 * client loses its `this` binding and throws "Cannot read properties of
 * undefined (reading 'rest')".
 */
export function rpcUntyped(fn: string, args?: Record<string, unknown>): Promise<RpcResult> {
  return (supabase as any).rpc(fn, args) as Promise<RpcResult>;
}

export async function waitlistRpc(fn: string, args?: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await rpcUntyped(fn, args);
  if (error) throw new Error(error.message);
  return data;
}

/* eslint-enable @typescript-eslint/no-explicit-any */
