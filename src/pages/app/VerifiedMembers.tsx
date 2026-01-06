import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { Search, ShieldCheck, BadgeCheck, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface VerifiedMember {
  id: string;
  display_name: string | null;
  photos: string[] | null;
  bio: string | null;
  id_verified: boolean;
  live_verified: boolean;
  id_verified_at: string | null;
  live_verified_at: string | null;
  account_mode: string | null;
}

type FilterType = "all" | "id" | "live" | "both";

export default function VerifiedMembers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: members, isLoading } = useQuery({
    queryKey: ["verified-members", filter],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, display_name, photos, bio, id_verified, live_verified, id_verified_at, live_verified_at, account_mode")
        .or("id_verified.eq.true,live_verified.eq.true")
        .order("live_verified_at", { ascending: false, nullsFirst: false });

      const { data, error } = await query;
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
      return member.display_name?.toLowerCase().includes(query);
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-4 py-8 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Verified Members</h1>
          </div>
          <p className="text-muted-foreground">
            Connect with verified members in our community
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs">Total Verified</span>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BadgeCheck className="w-4 h-4 text-slate-500" />
                <span className="text-xs">ID Verified</span>
              </div>
              <p className="text-2xl font-bold">{stats.idVerified}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BadgeCheck className="w-4 h-4 text-blue-500" />
                <span className="text-xs">Live Verified</span>
              </div>
              <p className="text-2xl font-bold">{stats.liveVerified}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span className="text-xs">Fully Verified</span>
              </div>
              <p className="text-2xl font-bold">{stats.fullyVerified}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-4 md:px-8 border-b border-border">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search verified members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="id" className="flex items-center gap-1">
                <BadgeCheck className="w-3 h-3 text-slate-500" />
                ID
              </TabsTrigger>
              <TabsTrigger value="live" className="flex items-center gap-1">
                <BadgeCheck className="w-3 h-3 text-blue-500" />
                Live
              </TabsTrigger>
              <TabsTrigger value="both" className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-green-500" />
                Both
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Members Grid */}
      <div className="px-4 py-6 md:px-8">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : !filteredMembers || filteredMembers.length === 0 ? (
            <div className="text-center py-16">
              <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No verified members found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Check back later for verified members"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/app/profile/${member.id}`)}
                >
                  <div className="aspect-[4/3] relative">
                    {member.photos?.[0] ? (
                      <img
                        src={member.photos[0]}
                        alt={member.display_name || "Member"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Users className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Verification badges overlay */}
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {member.id_verified && (
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-1.5">
                          <BadgeCheck className="w-4 h-4 text-slate-600" />
                        </div>
                      )}
                      {member.live_verified && (
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-1.5">
                          <BadgeCheck className="w-4 h-4 text-blue-500" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold truncate flex-1">
                        {member.display_name || "Anonymous"}
                      </h3>
                      <VerificationBadge
                        idVerified={member.id_verified}
                        liveVerified={member.live_verified}
                        size="sm"
                      />
                    </div>
                    {member.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {member.bio}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      {member.id_verified && (
                        <Badge variant="secondary" className="text-xs">
                          ID Verified
                        </Badge>
                      )}
                      {member.live_verified && (
                        <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600">
                          Live Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
