import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Video, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { TeamPostMedia } from "@/hooks/use-team-posts";

const MAX_IMAGES = 4;
const MAX_VIDEO_MB = 50;

interface Props {
  teamId: string;
  value: TeamPostMedia[];
  onChange: (next: TeamPostMedia[]) => void;
}

export function TeamMediaUploader({ teamId, value, onChange }: Props) {
  const { user } = useAuth();
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File, kind: "image" | "video") => {
    if (!user) return null;
    if (kind === "video" && file.size > MAX_VIDEO_MB * 1024 * 1024) {
      toast.error(`Video must be under ${MAX_VIDEO_MB}MB`);
      return null;
    }
    const ext = file.name.split(".").pop() || (kind === "video" ? "mp4" : "jpg");
    const path = `${teamId}/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("team-media").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      toast.error(error.message);
      return null;
    }
    const { data } = supabase.storage.from("team-media").getPublicUrl(path);
    return { url: data.publicUrl, type: kind } as TeamPostMedia;
  };

  const handleImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const slots = MAX_IMAGES - value.filter((m) => m.type === "image").length;
    if (slots <= 0) { toast.error(`Max ${MAX_IMAGES} images`); return; }
    setUploading(true);
    const next = [...value];
    for (const file of Array.from(files).slice(0, slots)) {
      const m = await upload(file, "image");
      if (m) next.push(m);
    }
    onChange(next);
    setUploading(false);
    if (imgRef.current) imgRef.current.value = "";
  };

  const handleVideo = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (value.some((m) => m.type === "video")) { toast.error("One video per post"); return; }
    setUploading(true);
    const m = await upload(file, "video");
    if (m) onChange([...value, m]);
    setUploading(false);
    if (vidRef.current) vidRef.current.value = "";
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((m, i) => (
            <div key={i} className="relative rounded-md overflow-hidden aspect-square bg-muted">
              {m.type === "image" ? (
                <img src={m.url} className="w-full h-full object-cover" alt="" />
              ) : (
                <video src={m.url} className="w-full h-full object-cover" muted />
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input ref={imgRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleImages(e.target.files)} />
        <input ref={vidRef} type="file" accept="video/mp4,video/quicktime,video/webm" hidden onChange={(e) => handleVideo(e.target.files)} />
        <Button type="button" variant="ghost" size="sm" onClick={() => imgRef.current?.click()} disabled={uploading} className="gap-1.5">
          <ImagePlus className="h-4 w-4" /> Photos
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => vidRef.current?.click()} disabled={uploading} className="gap-1.5">
          <Video className="h-4 w-4" /> Video
        </Button>
        {uploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
    </div>
  );
}