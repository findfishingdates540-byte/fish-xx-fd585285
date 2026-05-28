import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Lock,
  Users,
  Hash,
  Sailboat,
  Fish,
  Wrench,
  Trophy,
  Search,
  Bell,
  CircleUser,
  Image as ImageIcon,
  Video,
  MapPin,
  ClipboardList,
  Pin,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTeamContext } from "@/hooks/use-team-context";
import { useTeamRole } from "@/hooks/use-team-role";
import { TeamFeedTab } from "@/components/teams/TeamFeedTab";
import { EditTeamDialog } from "@/components/teams/EditTeamDialog";
import { TeamMentionsFeed } from "@/components/teams/TeamMentionsFeed";
import { TeamAboutPanel } from "@/components/teams/TeamAboutPanel";
import { TeamMembersPanel } from "@/components/teams/TeamMembersPanel";
import { TeamMediaTab } from "@/components/teams/TeamMediaTab";

type Channel = "general" | "trips" | "catches" | "gear" | "tournaments";

const CHANNELS: { id: Channel; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "general", label: "General", icon: Hash },
  { id: "trips", label: "Trips", icon: Sailboat },
  { id: "catches", label: "Catches", icon: Fish },
  { id: "gear", label: "Gear Talk", icon: Wrench },
  { id: "tournaments", label: "Tournaments", icon: Trophy },
];

export default function TeamGroup() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { team, teamLoading, members, pendingRequests, memberUserIds, profiles, isCaptain, isMember, memberCount } = useTeamContext(teamId);
  const { data: role } = useTeamRole(teamId);
  const [editOpen, setEditOpen] = useState(false);
  const [channel, setChannel] = useState<Channel>("general");
  const [section, setSection] = useState<"feed" | "about" | "members" | "media" | "mentions">("feed");

  if (teamLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-24">
        <Skeleton className="h-14" />
        <Skeleton className="h-[60vh] mt-4" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center py-20">
        <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground font-medium">Group not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/app/teams")}>Browse Teams</Button>
      </div>
    );
  }

  const teamTagline = (team.skill_level || "Members Clubhouse").toString().toUpperCase();
  const topMembers = memberUserIds.slice(0, 3).map((id) => profiles[id]).filter(Boolean);
  const onlineNow = memberUserIds.slice(0, 4).map((id) => profiles[id]).filter(Boolean);
  const dms = memberUserIds.filter((id) => id !== team.captain_id).slice(0, 2).map((id) => profiles[id]).filter(Boolean);

  return (
    <div className="scoreboard-hub min-h-screen bg-[hsl(var(--sb-bg))] text-[hsl(var(--sb-text))]">
      {/* Clubhouse top bar */}
      <div className="sticky top-16 z-30 border-b sb-border bg-[hsl(var(--sb-bg)/0.85)] backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold tracking-wider text-sm sb-text-cyan">
            <Trophy className="h-4 w-4" />
            {team.name.toUpperCase()} CLUBHOUSE
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <button
              onClick={() => navigate(`/app/teams/${teamId}`)}
              className="px-3 py-1.5 sb-text-muted hover:sb-text"
            >
              Public
            </button>
            <button
              className="px-3 py-1.5 sb-text-cyan border-b-2 border-[hsl(var(--sb-cyan))] -mb-px"
            >
              Members
            </button>
          </nav>
          <div className="ml-auto flex items-center gap-2 sb-text-muted">
            <button className="h-9 w-9 rounded-full hover:bg-[hsl(var(--sb-surface))] flex items-center justify-center">
              <Search className="h-4 w-4" />
            </button>
            <button className="h-9 w-9 rounded-full hover:bg-[hsl(var(--sb-surface))] flex items-center justify-center">
              <Bell className="h-4 w-4" />
            </button>
            <button onClick={() => navigate("/app/profile")} className="h-9 w-9 rounded-full hover:bg-[hsl(var(--sb-surface))] flex items-center justify-center">
              <CircleUser className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {isCaptain && <EditTeamDialog open={editOpen} onOpenChange={setEditOpen} team={team} />}

      {!isMember ? (
        <div className="max-w-3xl mx-auto rounded-xl border sb-border bg-[hsl(var(--sb-surface))] p-10 text-center my-10">
          <Lock className="h-10 w-10 mx-auto sb-text-muted mb-3" />
          <h2 className="font-bold text-lg mb-1">Members only</h2>
          <p className="text-sm sb-text-muted mb-4 max-w-md mx-auto">
            The Group is a private space for members of {team.name}. Join the team from the profile to enter the conversation.
          </p>
          <Button onClick={() => navigate(`/app/teams/${teamId}`)}>Back to profile</Button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr_300px] gap-0 lg:gap-6 px-0 lg:px-6 pb-24">
          {/* LEFT — Channels */}
          <aside className="hidden lg:flex flex-col gap-5 py-5 border-r sb-border pr-4 lg:sticky lg:top-[7.5rem] h-[calc(100dvh-7.5rem)] overflow-y-auto">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 rounded-md">
                <AvatarImage src={team.logo_url || undefined} />
                <AvatarFallback className="rounded-md bg-[hsl(var(--sb-cyan)/0.2)] sb-text-cyan font-bold">
                  {team.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{team.name.toUpperCase()}</p>
                <p className="text-[10px] sb-text-muted tracking-wider">{teamTagline}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold sb-text-muted tracking-widest mb-2 px-1">CHANNELS</p>
              <ul className="space-y-0.5">
                {CHANNELS.map((c) => {
                  const active = channel === c.id && section === "feed";
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => { setChannel(c.id); setSection("feed"); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                          active
                            ? "bg-[hsl(var(--sb-cyan)/0.12)] sb-text-cyan font-semibold"
                            : "sb-text-muted hover:bg-[hsl(var(--sb-surface))] hover:sb-text"
                        }`}
                      >
                        <c.icon className="h-4 w-4" />
                        {c.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {dms.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold sb-text-muted tracking-widest mb-2 px-1">DIRECT MESSAGES</p>
                <ul className="space-y-1">
                  {dms.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => navigate(`/app/messages/${p.id}`)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm sb-text-muted hover:bg-[hsl(var(--sb-surface))] hover:sb-text"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={p.photos?.[0]} />
                          <AvatarFallback className="text-[10px]">{p.display_name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{p.display_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-auto pt-3 border-t sb-border">
              <button
                onClick={() => setSection("members")}
                className="w-full flex items-center justify-between px-2 py-2 rounded-md text-sm sb-text-muted hover:bg-[hsl(var(--sb-surface))] hover:sb-text"
              >
                <span className="flex items-center gap-2"><Users className="h-4 w-4" /> MEMBERS</span>
                <span className="font-bold sb-text">{memberCount}</span>
              </button>
            </div>
          </aside>

          {/* CENTER */}
          <main className="min-w-0 py-5 px-4 lg:px-0">
            {/* Mobile section tabs */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
              {(["feed", "about", "members", "media", "mentions"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSection(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize ${
                    section === s ? "bg-[hsl(var(--sb-cyan))] text-[hsl(var(--sb-bg))]" : "bg-[hsl(var(--sb-surface))] sb-text-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {section === "feed" && (
              <>
                {/* Pinned channel header card */}
                <div className="rounded-xl border sb-border bg-[hsl(var(--sb-surface))] p-4 mb-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[hsl(var(--sb-cyan)/0.15)] sb-text-cyan flex items-center justify-center">
                    <Pin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm capitalize"># {CHANNELS.find((c) => c.id === channel)?.label}</p>
                    <p className="text-xs sb-text-muted truncate">
                      {team.group_description || `The ${CHANNELS.find((c) => c.id === channel)?.label.toLowerCase()} channel for ${team.name}.`}
                    </p>
                  </div>
                </div>

                <TeamFeedTab
                  teamId={teamId!}
                  surface="group"
                  teamName={team.name}
                  teamLogo={team.logo_url}
                  canPost={!!role?.canPostGroup}
                  canView={true}
                  isCaptain={isCaptain}
                />
              </>
            )}
            {section === "about" && <TeamAboutPanel team={team} memberUserIds={memberUserIds} memberCount={memberCount} />}
            {section === "members" && (
              <TeamMembersPanel team={team} members={members} pendingRequests={pendingRequests} profiles={profiles} isCaptain={isCaptain} />
            )}
            {section === "media" && <TeamMediaTab teamId={teamId!} />}
            {section === "mentions" && <TeamMentionsFeed teamName={team.name} />}
          </main>

          {/* RIGHT */}
          <aside className="hidden lg:flex flex-col gap-5 py-5 lg:sticky lg:top-[7.5rem] h-[calc(100dvh-7.5rem)] overflow-y-auto">
            <section>
              <p className="text-[10px] font-semibold sb-text-muted tracking-widest mb-3">TOP THIS MONTH</p>
              <ul className="space-y-2">
                {topMembers.length === 0 && <li className="text-xs sb-text-muted">No data yet.</li>}
                {topMembers.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[hsl(var(--sb-surface))]">
                    <span className="text-sm font-bold sb-text-muted w-3">{i + 1}</span>
                    <Avatar className="h-7 w-7"><AvatarImage src={p.photos?.[0]} /><AvatarFallback className="text-[10px]">{p.display_name?.[0]}</AvatarFallback></Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{p.display_name}</p>
                      <p className="text-[10px] sb-text-muted tracking-wider uppercase">{p.fishing_experience || "Angler"}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <p className="text-[10px] font-semibold sb-text-muted tracking-widest mb-3">ONLINE NOW</p>
              <ul className="space-y-2">
                {onlineNow.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--sb-cyan))]" />
                    <span className="truncate">{p.display_name}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <p className="text-[10px] font-semibold sb-text-muted tracking-widest mb-3">TEAM MILESTONES</p>
              <div className="rounded-lg border sb-border bg-[hsl(var(--sb-surface))] p-3">
                <p className="text-sm font-semibold mb-2">{memberCount} of 20 members</p>
                <div className="h-1.5 rounded-full bg-[hsl(var(--sb-bg))] overflow-hidden">
                  <div className="h-full bg-[hsl(var(--sb-cyan))]" style={{ width: `${Math.min(100, (memberCount / 20) * 100)}%` }} />
                </div>
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
