import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Crown, Fish, GripVertical, Info, Loader2, Lock, MapPin, Pin, PinOff, ScrollText, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { FormattedRules } from "@/lib/format-rules";

interface Props {
  team: any;
  memberCount: number;
  memberUserIds: string[];
  profiles: Record<string, { id: string; display_name: string | null; photos: string[] | null }>;
  isCaptain?: boolean;
}

export function TeamRightRail({ team, memberCount, memberUserIds, profiles, isCaptain = false }: Props) {
  const teamId = team.id as string;
  const qc = useQueryClient();

  // Pinned page posts
  const { data: pinned = [] } = useQuery({
    queryKey: ["team-rail-pinned", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_posts")
        .select("id, content, created_at, media, surface, pinned_order")
        .eq("team_id", teamId)
        .eq("pinned", true)
        .eq("is_hidden", false)
        .order("pinned_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(isCaptain ? 8 : 3);
      return data || [];
    },
  });

  // Local copy so drag reordering feels instant.
  const [orderedPinned, setOrderedPinned] = useState<any[]>([]);
  useEffect(() => { setOrderedPinned(pinned); }, [pinned]);
  const [dragId, setDragId] = useState<string | null>(null);

  const reorder = useMutation({
    mutationFn: async (rows: { id: string; pinned_order: number }[]) => {
      // Update each row's pinned_order; small N (≤8) so sequential is fine.
      for (const r of rows) {
        const { error } = await supabase.from("team_posts")
          .update({ pinned_order: r.pinned_order }).eq("id", r.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-rail-pinned", teamId] });
      qc.invalidateQueries({ queryKey: ["team-posts", teamId] });
    },
    onError: (e: any) => {
      toast.error(e?.message || "Could not save order");
      setOrderedPinned(pinned);
    },
  });

  const handleDrop = (overId: string) => {
    if (!dragId || dragId === overId) { setDragId(null); return; }
    const ids = orderedPinned.map((p) => p.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(overId);
    if (from === -1 || to === -1) { setDragId(null); return; }
    const next = [...orderedPinned];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrderedPinned(next);
    setDragId(null);
    reorder.mutate(next.map((p, i) => ({ id: p.id, pinned_order: i })));
  };

  const unpin = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("team_posts").update({ pinned: false }).eq("id", postId);
      if (error) throw error;
      return postId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-rail-pinned", teamId] });
      qc.invalidateQueries({ queryKey: ["team-posts", teamId] });
      toast.success("Unpinned");
    },
    onError: (e: any) => toast.error(e?.message || "Could not unpin"),
  });

  // Top contributors — by catch count among team members
  const { data: topContribs = [] } = useQuery({
    queryKey: ["team-rail-top-contribs", teamId, memberUserIds.join(",")],
    enabled: memberUserIds.length > 0,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data } = await supabase
        .from("catches")
        .select("user_id")
        .in("user_id", memberUserIds)
        .gte("caught_at", since.toISOString());
      const counts: Record<string, number> = {};
      (data || []).forEach((c: any) => {
        counts[c.user_id] = (counts[c.user_id] || 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId, count]) => ({ userId, count }));
    },
  });

  // Upcoming trips from team members
  const { data: upcomingTrips = [] } = useQuery({
    queryKey: ["team-rail-trips", teamId, memberUserIds.join(",")],
    enabled: memberUserIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("fishing_trips")
        .select("id, title, trip_date, location_name, user_id")
        .in("user_id", memberUserIds)
        .gte("trip_date", new Date().toISOString().slice(0, 10))
        .order("trip_date", { ascending: true })
        .limit(3);
      return data || [];
    },
  });

  return (
    <aside className="space-y-4">
      {/* About */}
      <section className="rounded-xl border bg-card p-5">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" /> About
        </h3>
        {team.description && (
          <p className="text-sm text-foreground/90 mb-3 whitespace-pre-wrap">{team.description}</p>
        )}
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            <span>
              <span className="font-medium text-foreground">{team.team_type === "private" ? "Private" : "Public"}</span>
              {" · "}Group posts are members-only
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            <span><span className="font-medium text-foreground">{memberCount}</span> members</span>
          </li>
          {team.location && (
            <li className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              <span>{team.location}</span>
            </li>
          )}
          <li className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>Established {new Date(team.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
          </li>
        </ul>
      </section>

      {/* Rules */}
      {team.rules ? (
        <section className="rounded-xl border bg-card p-5">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-primary" /> Group rules
          </h3>
          <FormattedRules text={team.rules} className="text-xs text-foreground/90" />
        </section>
      ) : isCaptain ? (
        <section className="rounded-xl border border-dashed bg-card/50 p-5">
          <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-muted-foreground" /> Group rules
          </h3>
          <p className="text-xs text-muted-foreground">Set expectations for your members. Use the edit pencil on the cover to add rules.</p>
        </section>
      ) : null}

      {/* Pinned / Featured */}
      {orderedPinned.length > 0 ? (
        <section className="rounded-xl border bg-card p-5">
          <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
            <Pin className="h-4 w-4 text-primary" /> Pinned / Featured
            {reorder.isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-1" />}
          </h3>
          {isCaptain && orderedPinned.length > 1 && (
            <p className="text-[10px] text-muted-foreground mb-3">Drag <GripVertical className="inline h-3 w-3 -mt-0.5" /> to reorder.</p>
          )}
          {!(isCaptain && orderedPinned.length > 1) && <div className="mb-2" />}
          <div className="space-y-3">
            {orderedPinned.map((p: any) => {
              const firstImg = Array.isArray(p.media)
                ? p.media.find((m: any) => m?.type === "image")?.url
                : null;
              const busy = unpin.isPending && unpin.variables === p.id;
              const isDragging = dragId === p.id;
              return (
                <div
                  key={p.id}
                  draggable={isCaptain}
                  onDragStart={(e) => { if (!isCaptain) return; setDragId(p.id); e.dataTransfer.effectAllowed = "move"; }}
                  onDragOver={(e) => { if (isCaptain && dragId) e.preventDefault(); }}
                  onDrop={(e) => { if (!isCaptain) return; e.preventDefault(); handleDrop(p.id); }}
                  onDragEnd={() => setDragId(null)}
                  className={`flex gap-2 items-start group rounded-md -mx-1 px-1 py-1 transition ${
                    isDragging ? "opacity-40" : "hover:bg-muted/40"
                  } ${isCaptain && dragId && !isDragging ? "outline-dashed outline-1 outline-primary/40" : ""}`}
                >
                  {isCaptain && (
                    <button
                      type="button"
                      className="cursor-grab active:cursor-grabbing text-muted-foreground/70 hover:text-foreground touch-none pt-3"
                      title="Drag to reorder"
                      onClick={(e) => e.preventDefault()}
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {firstImg ? (
                    <img src={firstImg} alt="" className="w-12 h-12 rounded-md object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-muted shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs line-clamp-2">{p.content || "(no caption)"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                      {" · "}<Badge variant="outline" className="h-3.5 text-[9px] px-1 ml-0.5">{p.surface}</Badge>
                    </p>
                  </div>
                  {isCaptain && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 -mr-1 opacity-60 hover:opacity-100"
                      title="Unpin"
                      disabled={busy}
                      onClick={() => unpin.mutate(p.id)}
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PinOff className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : isCaptain ? (
        <section className="rounded-xl border border-dashed bg-card/50 p-5">
          <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
            <Pin className="h-4 w-4 text-muted-foreground" /> Pinned / Featured
          </h3>
          <p className="text-xs text-muted-foreground">
            Highlight a post by opening its menu and choosing <span className="font-medium text-foreground">Pin to Featured</span>.
          </p>
        </section>
      ) : null}

      {/* Top contributors */}
      {topContribs.length > 0 && (
        <section className="rounded-xl border bg-card p-5">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> Top contributors
            <span className="text-[10px] font-normal text-muted-foreground ml-auto">last 30 days</span>
          </h3>
          <div className="space-y-2.5">
            {topContribs.map(({ userId, count }, i) => {
              const profile = profiles[userId];
              const isCaptain = team.captain_id === userId;
              return (
                <Link key={userId} to={`/app/u/${userId}`} className="flex items-center gap-3 hover:bg-muted/40 -mx-2 px-2 py-1 rounded-md transition">
                  <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.photos?.[0] || ""} />
                    <AvatarFallback className="text-xs">{(profile?.display_name || "?")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate flex items-center gap-1">
                      {profile?.display_name || "Angler"}
                      {isCaptain && <Crown className="h-3 w-3 text-primary" />}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5">
                    <Fish className="h-3 w-3" />{count}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Upcoming trips */}
      {upcomingTrips.length > 0 && (
        <section className="rounded-xl border bg-card p-5">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Upcoming trips
          </h3>
          <div className="space-y-2.5">
            {upcomingTrips.map((t: any) => {
              const profile = profiles[t.user_id];
              return (
                <Link key={t.id} to={`/app/trips/${t.id}`} className="block hover:bg-muted/40 -mx-2 px-2 py-1.5 rounded-md transition">
                  <p className="text-xs font-medium line-clamp-1">{t.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <span>{new Date(t.trip_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                    {t.location_name && <><span>·</span><span className="truncate">{t.location_name}</span></>}
                    {profile?.display_name && <><span>·</span><span className="truncate">{profile.display_name}</span></>}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </aside>
  );
}
