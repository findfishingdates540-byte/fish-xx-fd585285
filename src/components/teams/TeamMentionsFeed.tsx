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
      const { data: posts, error } = await supabase
        .from("feed_posts")
        .select("*")
        .ilike("content", `%@${noSpaces}%`)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      if (!posts?.length) return [];

      const userIds = [...new Set(posts.map((p: any) => p.user_id))];
      const catchIds = posts.map((p: any) => p.catch_id).filter(Boolean) as string[];

      const [{ data: profiles }, { data: catches }, { data: likes }] = await Promise.all([
        supabase
          .from("profiles_safe")
          .select("id, display_name, photos, id_verified, live_verified")
          .in("id", userIds),
        catchIds.length
          ? supabase
              .from("catches")
              .select("id, species_name, weight_lbs, length_in, photos")
              .in("id", catchIds)
          : Promise.resolve({ data: [] as any[] }),
        user?.id
          ? supabase
              .from("feed_likes")
              .select("post_id")
              .eq("user_id", user.id)
              .in("post_id", posts.map((p: any) => p.id))
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const catchMap = new Map((catches || []).map((c: any) => [c.id, c]));
      const likedIds = new Set((likes || []).map((l: any) => l.post_id));

      return posts.map((p: any) => ({
        ...p,
        profile: profileMap.get(p.user_id) || null,
        catch_data: p.catch_id ? catchMap.get(p.catch_id) || null : null,
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
