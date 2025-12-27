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
}

export interface FishSpeciesInput {
  name: string;
  scientific_name?: string;
  description?: string;
  image_url?: string;
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
