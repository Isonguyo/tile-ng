import { supabase } from "@/integrations/supabase/client";

/**
 * Some tables and columns in the production database are newer than the
 * generated type map, so these helpers give access to them without scattering
 * unsafe casts across the pages.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function fromUntyped(table: string): any {
  return (supabase as any).from(table);
}
/* eslint-enable @typescript-eslint/no-explicit-any */
