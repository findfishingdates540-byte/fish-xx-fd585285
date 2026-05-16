import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useTeamPostMutations, type TeamPostMedia, type TeamPostSurface, type TeamPostType,
} from "@/hooks/use-team-posts";
import { TeamMediaUploader } from "./TeamMediaUploader";

interface Props {
  teamId: string;
  surface: TeamPostSurface;
  teamName: string;
  teamLogo?: string | null;
}

const PAGE_TYPES: { value: TeamPostType; label: string }[] = [
  { value: "announcement", label: "📣 Announcement" },
  { value: "matchup", label: "⚔️ Next Matchup" },
  { value: "winning", label: "🏆 Winning" },
  { value: "teaser", label: "👀 Teaser" },
  { value: "update", label: "📰 Update" },
  { value: "general", label: "💬 General" },
];
const GROUP_TYPES: { value: TeamPostType; label: string }[] = [
  { value: "general", label: "💬 General" },
  { value: "catch", label: "🎣 Catch" },
  { value: "update", label: "📰 Update" },
];

export function TeamComposer({ teamId, surface, teamName, teamLogo }: Props) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<TeamPostMedia[]>([]);
  const [postType, setPostType] = useState<TeamPostType>(surface === "page" ? "announcement" : "general");
  const [location, setLocation] = useState("");
  const [crossPost, setCrossPost] = useState(surface === "page");
  const { create } = useTeamPostMutations(teamId, surface);

  const types = surface === "page" ? PAGE_TYPES : GROUP_TYPES;
  const canSubmit = (content.trim().length > 0 || media.length > 0) && !create.isPending;

  const submit = async () => {
    if (!canSubmit) return;
    await create.mutateAsync({
      content: content.trim(),
      media,
      post_type: postType,
      location_name: location.trim() || null,
      crossPostToFeed: surface === "page" ? crossPost : false,
    });
    setContent("");
    setMedia([]);
    setLocation("");
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={teamLogo || undefined} />
          <AvatarFallback>{teamName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="text-xs text-muted-foreground">
            Posting to <span className="font-semibold text-foreground">{teamName}</span>{" "}
            <span className="opacity-60">· {surface === "page" ? "Public Page" : "Members Group"}</span>
          </div>
          <Textarea
            placeholder={surface === "page" ? "Share an update with your fans…" : "Share with your team…"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none"
            maxLength={2000}
          />
        </div>
      </div>

      <TeamMediaUploader teamId={teamId} value={media} onChange={setMedia} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Select value={postType} onValueChange={(v) => setPostType(v as TeamPostType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          placeholder="Add location (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={120}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        {surface === "page" ? (
          <div className="flex items-center gap-2">
            <Switch id="cross-post" checked={crossPost} onCheckedChange={setCrossPost} />
            <Label htmlFor="cross-post" className="text-xs text-muted-foreground cursor-pointer">
              Also share to main Feed
            </Label>
          </div>
        ) : <span />}
        <Button onClick={submit} disabled={!canSubmit} size="sm" className="gap-1.5">
          <Send className="h-3.5 w-3.5" /> Post
        </Button>
      </div>
    </div>
  );
}