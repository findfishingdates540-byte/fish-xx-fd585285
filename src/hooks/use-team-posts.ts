import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type TeamPostSurface = "page" | "group";
export type TeamPostType =
  | "announcement" | "matchup" | "winning" | "teaser" | "update" | "catch" | "general";

export interface TeamPostMedia {
  url: string;
  type: "image" | "video";
}

export interface TeamPost {
  id: string;
  team_id: string;
  author_id: string;
  surface: TeamPostSurface;
  post_type: TeamPostType;
  content: string | null;
  media: TeamPostMedia[];
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  visibility?: "public" | "pending_review" | "hidden";
  pinned: boolean;
  likes_count: number;
  comments_count: number;
  is_hidden: boolean;
  created_at: string;
  author?: { id: string; display_name: string | null; photos: string[] | null } | null;
  viewer_liked?: boolean;
}

export interface TeamPostsFilters {
  sort?: "recent" | "top";
  near?: { lat: number; lng: number; radiusMi: number } | null;
}

function haversineMi(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function useTeamPosts(
  teamId: string | undefined,
  surface: TeamPostSurface,
  filters: TeamPostsFilters = {},
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const sort = filters.sort || "recent";
  const near = filters.near || null;
  const queryKey = ["team-posts", teamId, surface, sort, near?.radiusMi || 0, near?.lat || 0, near?.lng || 0] as const;

  const query = useQuery({
    queryKey,
    enabled: !!teamId,
    queryFn: async () => {
      let q = supabase
        .from("team_posts")
        .select("*")
        .eq("team_id", teamId!)
        .eq("surface", surface)
        .eq("is_hidden", false)
        .order("pinned", { ascending: false });
      if (sort === "top") {
        q = q.order("likes_count", { ascending: false }).order("created_at", { ascending: false });
      } else {
        q = q.order("created_at", { ascending: false });
      }
      const { data, error } = await q.limit(100);
      if (error) throw error;
      let posts = (data || []) as unknown as TeamPost[];
      if (near) {
        posts = posts.filter((p) => {
          if (p.location_lat == null || p.location_lng == null) return false;
          return haversineMi({ lat: near.lat, lng: near.lng }, { lat: Number(p.location_lat), lng: Number(p.location_lng) }) <= near.radiusMi;
        });
      }
      const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));
      if (authorIds.length === 0) return [];
      const { data: profs } = await supabase
        .from("profiles_safe")
        .select("id, display_name, photos")
        .in("id", authorIds);
      const map = new Map((profs || []).map((p: any) => [p.id, p]));

      let likedIds = new Set<string>();
      if (user) {
        const { data: likes } = await supabase
          .from("team_post_likes")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", posts.map((p) => p.id));
        likedIds = new Set((likes || []).map((l) => l.post_id));
      }

      return posts.map((p) => ({
        ...p,
        media: Array.isArray(p.media) ? (p.media as TeamPostMedia[]) : [],
        author: map.get(p.author_id) || null,
        viewer_liked: likedIds.has(p.id),
      })) as TeamPost[];
    },
  });

  // Realtime — posts + likes + comments
  useEffect(() => {
    if (!teamId) return;
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["team-posts", teamId, surface], exact: false });
    const channel = supabase
      .channel(`team-posts:${teamId}:${surface}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_posts", filter: `team_id=eq.${teamId}` },
        invalidate,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_post_likes" },
        invalidate,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_post_comments" },
        invalidate,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, surface, queryClient]);

  return query;
}

export function useTeamPostMutations(teamId: string, surface: TeamPostSurface) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const queryKey = ["team-posts", teamId, surface] as const;
  const invalidate = () => queryClient.invalidateQueries({ queryKey, exact: true });

  const create = useMutation({
    mutationFn: async (input: {
      content: string;
      media: TeamPostMedia[];
      post_type: TeamPostType;
      location_name?: string | null;
      location_lat?: number | null;
      location_lng?: number | null;
      crossPostToFeed?: boolean;
    }) => {
      if (!user) throw new Error("Login required");
      let feedId: string | null = null;
      if (surface === "page" && input.crossPostToFeed) {
        const photos = input.media.filter((m) => m.type === "image").map((m) => m.url);
        const video = input.media.find((m) => m.type === "video")?.url || null;
        const { data: feedRow } = await supabase
          .from("feed_posts")
          .insert({
            user_id: user.id,
            content: input.content || "",
            photos: photos.length ? photos : null,
            video_url: video,
            location_name: input.location_name || null,
          } as any)
          .select("id")
          .single();
        feedId = feedRow?.id || null;
      }
      const { error } = await supabase.from("team_posts").insert({
        team_id: teamId,
        author_id: user.id,
        surface,
        post_type: input.post_type,
        content: input.content || null,
        media: input.media as any,
        location_name: input.location_name || null,
        location_lat: input.location_lat ?? null,
        location_lng: input.location_lng ?? null,
        cross_posted_feed_id: feedId,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Posted!"); },
    onError: (e: any) => toast.error(e.message || "Could not post"),
  });

  const remove = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("team_posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Post deleted"); },
    onError: (e: any) => toast.error(e.message || "Delete failed"),
  });

  const togglePin = useMutation({
    mutationFn: async (p: { id: string; pinned: boolean }) => {
      const { error } = await supabase.from("team_posts").update({ pinned: !p.pinned }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleLike = useMutation({
    mutationFn: async (p: { id: string; liked: boolean }) => {
      if (!user) throw new Error("Login required");
      if (p.liked) {
        await supabase.from("team_post_likes").delete().eq("post_id", p.id).eq("user_id", user.id);
      } else {
        await supabase.from("team_post_likes").insert({ post_id: p.id, user_id: user.id });
      }
    },
    onSuccess: invalidate,
  });

  const report = useMutation({
    mutationFn: async (p: { id: string; reason: string }) => {
      if (!user) throw new Error("Login required");
      const { error } = await supabase.from("team_post_reports").insert({
        post_id: p.id, reporter_id: user.id, reason: p.reason,
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Report submitted. Our team will review it."),
    onError: (e: any) => toast.error(e.message || "Report failed"),
  });

  return { create, remove, togglePin, toggleLike, report };
}

// Comments
export interface TeamPostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author?: { display_name: string | null; photos: string[] | null } | null;
}

export function useTeamPostComments(postId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["team-post-comments", postId] as const;

  const query = useQuery({
    queryKey,
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_post_comments")
        .select("*")
        .eq("post_id", postId!)
        .eq("is_hidden", false)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data || []) as TeamPostComment[];
      const ids = Array.from(new Set(rows.map((c) => c.user_id)));
      if (ids.length === 0) return rows;
      const { data: profs } = await supabase
        .from("profiles_safe")
        .select("id, display_name, photos")
        .in("id", ids);
      const map = new Map((profs || []).map((p: any) => [p.id, p]));
      return rows.map((c) => ({ ...c, author: map.get(c.user_id) || null }));
    },
  });

  const add = useMutation({
    mutationFn: async (input: { content: string; parent_id?: string | null; user_id: string }) => {
      const { error } = await supabase.from("team_post_comments").insert({
        post_id: postId!,
        user_id: input.user_id,
        parent_id: input.parent_id || null,
        content: input.content,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey, exact: true }),
    onError: (e: any) => toast.error(e.message || "Could not comment"),
  });

  return { ...query, add };
}