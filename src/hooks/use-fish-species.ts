import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditAction } from './use-audit-logs';

export interface FishSpecies {
  id: string;
  name: string;
  scientific_name: string | null;
  description: string | null;
  image_url: string | null;
  created_at: string;
  base_score?: number | null;
  category?: string | null;
  water_type?: string | null;
  measurement_type?: string | null;
  safe_release?: boolean | null;
  trophy_unit?: string | null;
  trophy_quality?: number | null;
  trophy_trophy?: number | null;
  trophy_exceptional?: number | null;
}

export interface FishSpeciesInput {
  name: string;
  scientific_name?: string;
  description?: string;
  image_url?: string;
  base_score?: number | null;
  category?: string | null;
  water_type?: string | null;
  measurement_type?: string | null;
  safe_release?: boolean | null;
  trophy_unit?: string | null;
  trophy_quality?: number | null;
  trophy_trophy?: number | null;
  trophy_exceptional?: number | null;
}

export function useFishSpecies() {
  return useQuery({
    queryKey: ['fish-species'],
    queryFn: async (): Promise<FishSpecies[]> => {
      const { data, error } = await supabase
        .from('fish_species')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });
}

export function useCreateFishSpecies() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  return useMutation({
    mutationFn: async (input: FishSpeciesInput) => {
      const { data, error } = await supabase
        .from('fish_species')
        .insert({
          name: input.name.trim(),
          scientific_name: input.scientific_name?.trim() || null,
          description: input.description?.trim() || null,
          image_url: input.image_url?.trim() || null,
          base_score: input.base_score ?? null,
          category: input.category ?? null,
          water_type: input.water_type ?? null,
          measurement_type: input.measurement_type ?? 'TL',
          safe_release: input.safe_release ?? false,
          trophy_unit: input.trophy_unit ?? null,
          trophy_quality: input.trophy_quality ?? null,
          trophy_trophy: input.trophy_trophy ?? null,
          trophy_exceptional: input.trophy_exceptional ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['fish-species'] });
      toast.success('Fish species added successfully');
      await logAction('species_created', 'species', data.id, { name: data.name });
    },
    onError: (error) => {
      toast.error(`Failed to add species: ${error.message}`);
    },
  });
}

export function useUpdateFishSpecies() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: FishSpeciesInput }) => {
      const { data, error } = await supabase
        .from('fish_species')
        .update({
          name: input.name.trim(),
          scientific_name: input.scientific_name?.trim() || null,
          description: input.description?.trim() || null,
          image_url: input.image_url?.trim() || null,
          base_score: input.base_score ?? null,
          category: input.category ?? null,
          water_type: input.water_type ?? null,
          measurement_type: input.measurement_type ?? 'TL',
          safe_release: input.safe_release ?? false,
          trophy_unit: input.trophy_unit ?? null,
          trophy_quality: input.trophy_quality ?? null,
          trophy_trophy: input.trophy_trophy ?? null,
          trophy_exceptional: input.trophy_exceptional ?? null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['fish-species'] });
      toast.success('Fish species updated successfully');
      await logAction('species_updated', 'species', data.id, { name: data.name });
    },
    onError: (error) => {
      toast.error(`Failed to update species: ${error.message}`);
    },
  });
}

export function useDeleteFishSpecies() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fish_species')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: async (id) => {
      queryClient.invalidateQueries({ queryKey: ['fish-species'] });
      toast.success('Fish species deleted successfully');
      await logAction('species_deleted', 'species', id);
    },
    onError: (error) => {
      toast.error(`Failed to delete species: ${error.message}`);
    },
  });
}
