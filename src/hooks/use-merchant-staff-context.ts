import { useQuery } from "@tanstack/react-query";
import { rpcUntyped } from "@/lib/waitlist-rpc";

type Row = Record<string, unknown>;

export type MerchantStaffContext = {
  is_staff: boolean;
  owner_id: string | null;
  role: "staff" | "manager" | null;
};

function record(value: unknown): Row | null {
  if (Array.isArray(value)) return record(value[0]);
  return value && typeof value === "object" ? (value as Row) : null;
}

export function useMerchantStaffContext(userId: string | undefined) {
  return useQuery<MerchantStaffContext | null>({
    queryKey: ["staff-context", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("get_my_staff_context");
      if (error) throw error;
      const root = record(data);
      const row = record(root?.staff_context) ?? root;
      if (!row) return null;
      return {
        is_staff: row.is_staff === true,
        owner_id: typeof row.owner_id === "string" ? row.owner_id : null,
        role: row.role === "staff" || row.role === "manager" ? row.role : null,
      };
    },
  });
}
