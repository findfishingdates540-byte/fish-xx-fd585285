import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Image as ImageIcon, Play } from "lucide-react";

interface Props {
  teamId: string;
}

export function TeamMediaTab({ teamId }: Props) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["team-media", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_posts")
        .select("id, media, created_at")
        .eq("team_id", teamId)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(60);
      const out: { url: string; type: "image" | "video"; postId: string }[] = [];
      (data || []).forEach((p: any) => {
        if (Array.isArray(p.media)) {
          p.media.forEach((m: any) => {
            if (m?.url) out.push({ url: m.url, type: m.type || "image", postId: p.id });
          });
        }
      });
      return out;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="font-semibold">No media yet</p>
        <p className="text-sm text-muted-foreground mt-1">Photos and videos from posts will show up here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
      {items.map((m, i) => (
        <div key={`${m.postId}-${i}`} className="relative aspect-square bg-muted overflow-hidden group">
          {m.type === "image" ? (
            <img src={m.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          ) : (
            <>
              <video src={m.url} className="w-full h-full object-cover" />
              <div className="absolute inset-0 grid place-items-center bg-black/30 pointer-events-none">
                <Play className="h-6 w-6 text-white fill-white" />
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
