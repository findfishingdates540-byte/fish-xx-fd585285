import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fish-species'] });
      toast.success('Fish species added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add species: ${error.message}`);
    },
  });
}

export function useUpdateFishSpecies() {
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fish-species'] });
      toast.success('Fish species updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update species: ${error.message}`);
    },
  });
}

export function useDeleteFishSpecies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fish_species')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fish-species'] });
      toast.success('Fish species deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete species: ${error.message}`);
    },
  });
}
