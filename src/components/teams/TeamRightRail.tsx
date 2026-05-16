import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Crown, Fish, Info, Lock, MapPin, Pin, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface Props {
  team: any;
  memberCount: number;
  memberUserIds: string[];
  profiles: Record<string, { id: string; display_name: string | null; photos: string[] | null }>;
}

export function TeamRightRail({ team, memberCount, memberUserIds, profiles }: Props) {
  const teamId = team.id as string;

  // Pinned page posts
  const { data: pinned = [] } = useQuery({
    queryKey: ["team-rail-pinned", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_posts")
        .select("id, content, created_at, media, surface")
        .eq("team_id", teamId)
        .eq("pinned", true)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
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

      {/* Pinned */}
      {pinned.length > 0 && (
        <section className="rounded-xl border bg-card p-5">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Pin className="h-4 w-4 text-primary" /> Pinned
          </h3>
          <div className="space-y-3">
            {pinned.map((p: any) => {
              const firstImg = Array.isArray(p.media)
                ? p.media.find((m: any) => m?.type === "image")?.url
                : null;
              return (
                <div key={p.id} className="flex gap-3 items-start">
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
                </div>
              );
            })}
          </div>
        </section>
      )}

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
