import { useState } from 'react';
import { Search, MoreVertical, MapPin, Star, Eye, Trash2, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminSpots() {
  const [search, setSearch] = useState('');

  const { data: spots, isLoading } = useQuery({
    queryKey: ['admin-spots', search],
    queryFn: async () => {
      let query = supabase
        .from('fishing_spots')
        .select(`
          *,
          creator:profiles!fishing_spots_created_by_fkey(id, display_name, photos)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (search) {
        query = query.or(`name.ilike.%${search}%,location_name.ilike.%${search}%`);
      }

      const { data } = await query;
      return data || [];
    },
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Fishing Spots</h1>
          <p className="text-slate-400 mt-1">Manage all fishing spots on the platform</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search spots by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Spots Grid */}
      <div className="grid grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-64 bg-slate-800" />
          ))
        ) : spots?.length === 0 ? (
          <div className="col-span-3 bg-slate-800/50 rounded-xl p-12 text-center border border-slate-700/50">
            <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No spots found</h3>
            <p className="text-slate-400">No fishing spots match your search.</p>
          </div>
        ) : (
          spots?.map((spot) => (
            <div
              key={spot.id}
              className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50"
            >
              {/* Spot Image */}
              <div className="aspect-video bg-slate-700 relative">
                {spot.photos?.[0] ? (
                  <img
                    src={spot.photos[0]}
                    alt={spot.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-slate-500" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  {spot.is_verified && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {!spot.is_public && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-0">
                      Private
                    </Badge>
                  )}
                </div>
              </div>

              {/* Spot Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-white">{spot.name}</h3>
                    <p className="text-sm text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {spot.location_name || 'Unknown location'}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-700">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verify Spot
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-rose-400 focus:text-rose-300 focus:bg-slate-700">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Spot
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{spot.rating_avg?.toFixed(1) || 'N/A'}</span>
                    <span className="text-slate-500">({spot.rating_count} reviews)</span>
                  </div>
                  <span className="text-slate-500">
                    {format(new Date(spot.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
