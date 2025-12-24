import { Heart, MessageCircle, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function AdminMatches() {
  const { data: matches, isLoading } = useQuery({
    queryKey: ['admin-matches'],
    queryFn: async () => {
      const { data } = await supabase
        .from('matches')
        .select(`
          *,
          user1:profiles!matches_user1_id_fkey(id, display_name, photos),
          user2:profiles!matches_user2_id_fkey(id, display_name, photos)
        `)
        .eq('is_match', true)
        .order('matched_at', { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['match-stats'],
    queryFn: async () => {
      const [
        { count: totalMatches },
        { count: totalLikes },
        { count: totalMessages }
      ] = await Promise.all([
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('is_match', true),
        supabase.from('matches').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
      ]);

      return {
        totalMatches: totalMatches || 0,
        totalLikes: totalLikes || 0,
        totalMessages: totalMessages || 0,
      };
    },
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Matches</h1>
          <p className="text-slate-400 mt-1">View and manage dating matches</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-rose-500/20">
              <Heart className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.totalMatches || 0}</p>
              <p className="text-sm text-slate-400">Total Matches</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-violet-500/20">
              <Users className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.totalLikes || 0}</p>
              <p className="text-sm text-slate-400">Total Interactions</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-cyan-500/20">
              <MessageCircle className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.totalMessages || 0}</p>
              <p className="text-sm text-slate-400">Messages Sent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Matches List */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 text-left text-xs text-slate-400 uppercase">
              <th className="px-6 py-4">Users</th>
              <th className="px-6 py-4">Matched On</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="h-12 w-64 bg-slate-700" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-32 bg-slate-700" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 bg-slate-700" /></td>
                </tr>
              ))
            ) : matches?.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                  No matches found
                </td>
              </tr>
            ) : (
              matches?.map((match) => (
                <tr key={match.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <Avatar className="w-10 h-10 border-2 border-slate-800">
                          <AvatarImage src={match.user1?.photos?.[0]} />
                          <AvatarFallback className="bg-slate-700 text-white">
                            {match.user1?.display_name?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <Avatar className="w-10 h-10 -ml-3 border-2 border-slate-800">
                          <AvatarImage src={match.user2?.photos?.[0]} />
                          <AvatarFallback className="bg-slate-700 text-white">
                            {match.user2?.display_name?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {match.user1?.display_name || 'Unknown'} & {match.user2?.display_name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {match.matched_at 
                      ? format(new Date(match.matched_at), 'MMM d, yyyy h:mm a')
                      : 'N/A'
                    }
                  </td>
                  <td className="px-6 py-4">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                      <Heart className="w-3 h-3 mr-1 fill-current" />
                      Matched
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
