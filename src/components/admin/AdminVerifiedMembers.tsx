import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ShieldCheck, BadgeCheck, Users, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface VerifiedMember {
  id: string;
  display_name: string | null;
  email: string | null;
  photos: string[] | null;
  bio: string | null;
  id_verified: boolean;
  live_verified: boolean;
  id_verified_at: string | null;
  live_verified_at: string | null;
  account_mode: string | null;
}

type FilterType = "all" | "id" | "live" | "both";

export function AdminVerifiedMembers() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: members, isLoading } = useQuery({
    queryKey: ["admin-verified-members", filter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, email, photos, bio, id_verified, live_verified, id_verified_at, live_verified_at, account_mode")
        .or("id_verified.eq.true,live_verified.eq.true")
        .order("live_verified_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as VerifiedMember[];
    },
  });

  const filteredMembers = members?.filter((member) => {
    // Apply verification filter
    if (filter === "id" && !member.id_verified) return false;
    if (filter === "live" && !member.live_verified) return false;
    if (filter === "both" && (!member.id_verified || !member.live_verified)) return false;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        member.display_name?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const stats = {
    total: members?.length || 0,
    idVerified: members?.filter((m) => m.id_verified).length || 0,
    liveVerified: members?.filter((m) => m.live_verified).length || 0,
    fullyVerified: members?.filter((m) => m.id_verified && m.live_verified).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">Total Verified</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <BadgeCheck className="w-4 h-4 text-slate-400" />
            <span className="text-xs">ID Verified</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.idVerified}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <BadgeCheck className="w-4 h-4 text-blue-400" />
            <span className="text-xs">Live Verified</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.liveVerified}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs">Fully Verified</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.fullyVerified}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-slate-700">All</TabsTrigger>
            <TabsTrigger value="id" className="data-[state=active]:bg-slate-700 flex items-center gap-1">
              <BadgeCheck className="w-3 h-3 text-slate-400" />
              ID
            </TabsTrigger>
            <TabsTrigger value="live" className="data-[state=active]:bg-slate-700 flex items-center gap-1">
              <BadgeCheck className="w-3 h-3 text-blue-400" />
              Live
            </TabsTrigger>
            <TabsTrigger value="both" className="data-[state=active]:bg-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Both
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Members Table */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 bg-slate-800" />
          ))}
        </div>
      ) : !filteredMembers || filteredMembers.length === 0 ? (
        <div className="bg-slate-800/50 rounded-xl p-12 text-center border border-slate-700/50">
          <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No verified members found</h3>
          <p className="text-slate-400">
            {searchQuery
              ? "Try adjusting your search"
              : "No members match the selected filter"}
          </p>
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">
                  Member
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">
                  Verification
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3 hidden md:table-cell">
                  Verified At
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">
                  Mode
                </th>
                <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.photos?.[0]} />
                        <AvatarFallback className="bg-slate-700 text-white">
                          {member.display_name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{member.display_name || "Anonymous"}</p>
                        <p className="text-sm text-slate-400">{member.email || "No email"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {member.id_verified && (
                        <Badge className="bg-slate-500/20 text-slate-300 border-0">
                          <BadgeCheck className="w-3 h-3 mr-1" />
                          ID
                        </Badge>
                      )}
                      {member.live_verified && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-0">
                          <BadgeCheck className="w-3 h-3 mr-1" />
                          Live
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="text-sm text-slate-400">
                      {member.id_verified_at && (
                        <div>ID: {format(new Date(member.id_verified_at), "MMM d, yyyy")}</div>
                      )}
                      {member.live_verified_at && (
                        <div>Live: {format(new Date(member.live_verified_at), "MMM d, yyyy")}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <Badge className="bg-slate-500/20 text-slate-300 border-0 capitalize">
                      {member.account_mode || "Unknown"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                      onClick={() => window.open(`/app/profile/${member.id}`, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
