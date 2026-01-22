import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Story {
  id: string;
  user_id: string;
  media_url: string | null;
  media_type: 'image' | 'video' | 'text';
  text_overlay: string | null;
  background_color: string;
  created_at: string;
  expires_at: string;
  profile?: {
    id: string;
    display_name: string | null;
    photos: string[] | null;
  };
  views_count?: number;
  has_viewed?: boolean;
}

export interface GroupedStories {
  user_id: string;
  display_name: string | null;
  photo: string | null;
  stories: Story[];
  has_unviewed: boolean;
}

export function useStories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stories', user?.id],
    queryFn: async (): Promise<GroupedStories[]> => {
      if (!user?.id) return [];

      // Fetch active stories (not expired) from users we follow + our own
      const { data: stories, error } = await supabase
        .from('stories')
        .select(`
          *,
          profile:profiles!stories_user_id_fkey(id, display_name, photos)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!stories) return [];

      // Fetch view status for these stories
      const storyIds = stories.map(s => s.id);
      const { data: views } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('viewer_id', user.id)
        .in('story_id', storyIds);

      const viewedStoryIds = new Set(views?.map(v => v.story_id) || []);

      // Helper to convert story to proper type
      const toStory = (s: typeof stories[0], hasViewed: boolean): Story => ({
        ...s,
        media_type: s.media_type as 'image' | 'video' | 'text',
        has_viewed: hasViewed,
      });

      // Group stories by user
      const grouped = new Map<string, GroupedStories>();
      
      // Add current user first if they have stories
      const myStories = stories.filter(s => s.user_id === user.id);
      if (myStories.length > 0) {
        const profile = myStories[0].profile;
        grouped.set(user.id, {
          user_id: user.id,
          display_name: profile?.display_name || 'You',
          photo: profile?.photos?.[0] || null,
          stories: myStories.map(s => toStory(s, viewedStoryIds.has(s.id))),
          has_unviewed: myStories.some(s => !viewedStoryIds.has(s.id))
        });
      }

      // Add other users' stories
      stories.filter(s => s.user_id !== user.id).forEach(story => {
        const existing = grouped.get(story.user_id);
        if (existing) {
          existing.stories.push(toStory(story, viewedStoryIds.has(story.id)));
          if (!viewedStoryIds.has(story.id)) {
            existing.has_unviewed = true;
          }
        } else {
          grouped.set(story.user_id, {
            user_id: story.user_id,
            display_name: story.profile?.display_name || 'User',
            photo: story.profile?.photos?.[0] || null,
            stories: [toStory(story, viewedStoryIds.has(story.id))],
            has_unviewed: !viewedStoryIds.has(story.id)
          });
        }
      });

      return Array.from(grouped.values());
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      media_url?: string;
      media_type: 'image' | 'video' | 'text';
      text_overlay?: string;
      background_color?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: data.media_url || null,
          media_type: data.media_type,
          text_overlay: data.text_overlay || null,
          background_color: data.background_color || '#1877F2',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Story posted!');
    },
    onError: (error) => {
      toast.error('Failed to post story');
      console.error(error);
    },
  });
}

export function useMarkStoryViewed() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (storyId: string) => {
      if (!user?.id) return;

      // Use upsert to avoid duplicate errors
      await supabase
        .from('story_views')
        .upsert(
          { story_id: storyId, viewer_id: user.id },
          { onConflict: 'story_id,viewer_id' }
        );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Story deleted');
    },
    onError: () => {
      toast.error('Failed to delete story');
    },
  });
}
