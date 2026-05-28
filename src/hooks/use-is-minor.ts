import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns whether the current user is a minor (ages 13-17) and the related
 * junior-angler flag. Used to gate adult-only features (dating, open DMs, etc.).
 */
export function useIsMinor() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["is-minor", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_minor, is_junior_account, date_of_birth")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return {
        isMinor: !!data?.is_minor,
        isJunior: !!data?.is_junior_account,
        dateOfBirth: data?.date_of_birth as string | null,
      };
    },
  });

  return {
    isMinor: data?.isMinor ?? false,
    isJunior: data?.isJunior ?? false,
    dateOfBirth: data?.dateOfBirth ?? null,
    isLoading,
  };
}