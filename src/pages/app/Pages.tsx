import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Compass, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type FollowedTeam = {
  team_id: string;
  created_at: string;
  team: {
    id: string;
    name: string;
    logo_url: string | null;
    description: string | null;
    followers_count: number | null;
    location: string | null;
  } | null;
  latest_post?: { id: string; created_at: string; content: string | null } | null;
};

export default function Pages() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['followed-team-pages', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<FollowedTeam[]> => {
      const { data: follows, error } = await supabase
        .from('team_followers')
        .select('team_id, created_at, fishing_teams:team_id(id, name, logo_url, description, followers_count, location)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const teamIds = (follows || []).map((f: any) => f.team_id);
      let latestByTeam: Record<string, any> = {};
      if (teamIds.length) {
        const { data: posts } = await supabase
          .from('team_posts')
          .select('id, team_id, content, created_at')
          .in('team_id', teamIds)
          .eq('surface', 'page')
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .limit(50);
        (posts || []).forEach((p: any) => {
          if (!latestByTeam[p.team_id]) latestByTeam[p.team_id] = p;
        });
      }

      return (follows || []).map((f: any) => ({
        team_id: f.team_id,
        created_at: f.created_at,
        team: f.fishing_teams,
        latest_post: latestByTeam[f.team_id] || null,
      }));
    },
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Pages</h1>
            <p className="text-sm text-muted-foreground">Team Pages you follow</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/app/teams"><Compass className="h-4 w-4 mr-2" /> Discover Teams</Link>
          </Button>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !data?.length ? (
          <div className="bg-card border rounded-xl p-10 text-center">
            <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-1">No followed Pages yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Browse teams and tap Follow Page to see their updates here.</p>
            <Button asChild><Link to="/app/teams">Browse Teams</Link></Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {data.map((f) => (
              <li key={f.team_id}>
                <Link
                  to={`/app/teams/${f.team_id}`}
                  className="flex gap-4 bg-card border rounded-xl p-4 hover:bg-accent/30 transition-colors"
                >
                  <Avatar className="h-14 w-14 border">
                    <AvatarImage src={f.team?.logo_url || undefined} alt={f.team?.name || 'Team'} />
                    <AvatarFallback>{f.team?.name?.charAt(0) || 'T'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold truncate">{f.team?.name || 'Team'}</h3>
                      <Badge variant="secondary" className="shrink-0">
                        {f.team?.followers_count ?? 0} followers
                      </Badge>
                    </div>
                    {f.team?.location && (
                      <p className="text-xs text-muted-foreground">{f.team.location}</p>
                    )}
                    {f.latest_post ? (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        <span className="font-medium text-foreground">Latest · {formatDistanceToNow(new Date(f.latest_post.created_at), { addSuffix: true })}: </span>
                        {f.latest_post.content || '(media post)'}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground italic">No Page posts yet.</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}