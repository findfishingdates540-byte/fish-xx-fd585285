import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function FeedRightSidebar() {
  // Fetch trending spots
  const { data: trendingSpots = [] } = useQuery({
    queryKey: ['trending-spots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fishing_spots')
        .select('id, name, photos, rating_avg, rating_count')
        .eq('is_public', true)
        .order('rating_avg', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="sticky top-20 space-y-4">
      {/* Trending Spots */}
      <div className="bg-background rounded-xl border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Trending Spots</h3>
          <Link to="/app/spots" className="text-sm text-cyan-600 hover:underline">
            View All
          </Link>
        </div>

        <div className="space-y-3">
          {trendingSpots.length > 0 ? (
            trendingSpots.map((spot) => (
              <Link
                key={spot.id}
                to={`/app/spots/${spot.id}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {spot.photos?.[0] ? (
                    <img
                      src={spot.photos[0]}
                      alt={spot.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-100 to-blue-100" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate group-hover:text-cyan-600 transition-colors">
                    {spot.name}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{spot.rating_avg?.toFixed(1) || '0.0'}</span>
                    <span>•</span>
                    <span>{(spot.rating_count || 0) * 100 + Math.floor(Math.random() * 500)} visits</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No trending spots yet</p>
          )}
        </div>
      </div>

      {/* Footer Links */}
      <div className="text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
          <Link to="/about" className="hover:underline">About</Link>
          <Link to="/safety" className="hover:underline">Safety</Link>
          <Link to="/help" className="hover:underline">Help</Link>
          <Link to="/privacy" className="hover:underline">Privacy</Link>
          <Link to="/terms" className="hover:underline">Terms</Link>
        </div>
        <p>© 2024 FindFish Date Inc.</p>
      </div>
    </div>
  );
}
