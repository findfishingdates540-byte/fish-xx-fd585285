import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type PagePost = {
  id: string;
  team_id: string;
  content: string | null;
  media: any;
  created_at: string;
  team: { id: string; name: string; logo_url: string | null } | null;
};

export function FollowedPagesStrip() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['followed-pages-strip', user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async (): Promise<PagePost[]> => {
      const { data: follows } = await supabase
        .from('team_followers')
        .select('team_id')
        .eq('user_id', user!.id);
      const teamIds = (follows || []).map((f: any) => f.team_id);
      if (!teamIds.length) return [];

      const { data: posts } = await supabase
        .from('team_posts')
        .select('id, team_id, content, media, created_at, fishing_teams:team_id(id, name, logo_url)')
        .in('team_id', teamIds)
        .eq('surface', 'page')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(6);

      return (posts || []).map((p: any) => ({ ...p, team: p.fishing_teams }));
    },
  });

  if (isLoading || !data?.length) return null;

  return (
    <div className="bg-card rounded-xl border mx-3 md:mx-0">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">From Pages you follow</h3>
        <Link to="/app/pages" className="text-xs text-primary inline-flex items-center hover:underline">
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <ul className="divide-y">
        {data.map((p) => {
          const firstMedia = Array.isArray(p.media) ? p.media[0] : null;
          const thumb = firstMedia?.url || firstMedia?.poster_url || null;
          return (
            <li key={p.id}>
              <Link
                to={`/app/teams/${p.team_id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors"
              >
                <Avatar className="h-10 w-10 border shrink-0">
                  <AvatarImage src={p.team?.logo_url || undefined} alt={p.team?.name || 'Team'} />
                  <AvatarFallback>{p.team?.name?.charAt(0) || 'T'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.team?.name || 'Team'}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {p.content || '(media post)'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                  </p>
                </div>
                {thumb && (
                  <img src={thumb} alt="" className="h-12 w-12 rounded-md object-cover shrink-0" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}