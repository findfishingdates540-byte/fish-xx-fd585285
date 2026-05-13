import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsPremium } from "@/hooks/use-is-premium";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

const KEY = "tournament_creator_requirement";
export type CreatorRequirement = "anyone" | "premium" | "verified" | "admin";
const DEFAULT: CreatorRequirement = "premium";

export function useTournamentCreatorRequirement() {
  return useQuery({
    queryKey: ["app-setting", KEY],
    queryFn: async (): Promise<CreatorRequirement> => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", KEY)
        .maybeSingle();
      const req = (data?.value as { requirement?: CreatorRequirement } | null)?.requirement;
      return req ?? DEFAULT;
    },
    staleTime: 60_000,
  });
}

export function useUpdateTournamentCreatorRequirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requirement: CreatorRequirement) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("app_settings")
        .update({
          value: { requirement } as unknown as Json,
          updated_at: new Date().toISOString(),
          updated_by: user?.id ?? null,
        })
        .eq("key", KEY);
      if (error) throw error;
      return requirement;
    },
    onSuccess: (req) => {
      qc.invalidateQueries({ queryKey: ["app-setting", KEY] });
      toast.success(`Tournament creator requirement set to: ${req}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Returns whether the current user is allowed to create tournaments. */
export function useCanCreateTournament() {
  const { user } = useAuth();
  const { data: requirement = DEFAULT, isLoading: reqLoading } = useTournamentCreatorRequirement();
  const { isPremium, isLoading: premiumLoading } = useIsPremium();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  const { data: verified, isLoading: vLoading } = useQuery({
    queryKey: ["my-verification", user?.id],
    enabled: !!user?.id && requirement === "verified",
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id_verified, live_verified")
        .eq("id", user!.id)
        .maybeSingle();
      return !!(data?.id_verified || data?.live_verified);
    },
  });

  const isLoading = reqLoading || premiumLoading || adminLoading || (requirement === "verified" && vLoading);

  let canCreate = false;
  if (isAdmin) canCreate = true;
  else if (requirement === "anyone") canCreate = !!user;
  else if (requirement === "premium") canCreate = isPremium;
  else if (requirement === "verified") canCreate = !!verified;
  else if (requirement === "admin") canCreate = false;

  return { canCreate, requirement, isLoading };
}