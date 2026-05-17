import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FeedPost } from "@/components/feed/FeedPost";
import { AtSign, Loader2 } from "lucide-react";
import type { FeedPost as FeedPostType } from "@/hooks/use-feed";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  teamName: string;
}

export function TeamMentionsFeed({ teamName }: Props) {
  const { user } = useAuth();
  const noSpaces = teamName.replace(/\s+/g, "");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["team-mentions", noSpaces],
    enabled: !!noSpaces,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_posts")
        .select(`
          id, user_id, catch_id, content, photos, video_url, location_name,
          likes_count, comments_count, created_at, updated_at,
          profile:profiles!feed_posts_user_id_fkey(id, display_name, photos, id_verified, live_verified),
          catch_data:catches(id, species_name, weight_lbs, length_in, photos)
        `)
        .ilike("content", `%@${noSpaces}%`)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      const ids = (data || []).map((p: any) => p.id);
      let likedIds = new Set<string>();
      if (user?.id && ids.length) {
        const { data: likes } = await supabase
          .from("feed_likes")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", ids);
        likedIds = new Set((likes || []).map((l: any) => l.post_id));
      }

      return (data || []).map((p: any) => ({
        ...p,
        profile: Array.isArray(p.profile) ? p.profile[0] : p.profile,
        catch_data: Array.isArray(p.catch_data) ? p.catch_data[0] : p.catch_data,
        user_has_liked: likedIds.has(p.id),
      })) as FeedPostType[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!posts?.length) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <AtSign className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
        <h3 className="font-semibold mb-1">No mentions yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          When someone tags <span className="font-medium text-foreground">@{noSpaces}</span> in a post, it'll show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <FeedPost key={post.id} post={post} />
      ))}
    </div>
  );
}
