import { useState } from 'react';
import { Search, Calendar, MapPin, Users, Clock, Eye, Trash2, MoreVertical, Anchor } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Trip {
  id: string;
  title: string;
  trip_date: string;
  start_time: string | null;
  end_time: string | null;
  location_name: string | null;
  status: string;
  trip_type: string;
  target_species: string[] | null;
  notes: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    photos: string[] | null;
  } | null;
  spot: {
    id: string;
    name: string;
    location_name: string | null;
  } | null;
}

export default function AdminTrips() {
  const [search, setSearch] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: trips, isLoading } = useQuery({
    queryKey: ['admin-trips', search],
    queryFn: async (): Promise<Trip[]> => {
      let query = supabase
        .from('fishing_trips')
        .select(`
          *,
          user:profiles!fishing_trips_user_id_fkey(id, display_name, photos),
          spot:fishing_spots!fishing_trips_fishing_spot_id_fkey(id, name, location_name)
        `)
        .order('trip_date', { ascending: false })
        .limit(100);

      if (search) {
        query = query.or(`title.ilike.%${search}%,location_name.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });

  const { mutate: deleteTrip, isPending: deletePending } = useMutation({
    mutationFn: async (id: string) => {
      // First delete participants
      await supabase.from('trip_participants').delete().eq('trip_id', id);
      // Then delete the trip
      const { error } = await supabase.from('fishing_trips').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
      toast.success('Trip deleted successfully');
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to delete trip: ${error.message}`);
    },
  });

  const handleViewDetails = (trip: Trip) => {
    setSelectedTrip(trip);
    setDetailsOpen(true);
  };

  const handleDeleteTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setDeleteDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-amber-500/20 text-amber-400';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Fishing Trips</h1>
          <p className="text-slate-400 mt-1">View all fishing trips on the platform</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search trips by title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 text-left text-xs text-slate-400 uppercase">
              <th className="px-6 py-4">Trip</th>
              <th className="px-6 py-4">Organizer</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="h-12 w-48 bg-slate-700" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-10 w-32 bg-slate-700" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-24 bg-slate-700" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-16 bg-slate-700" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 bg-slate-700" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-8 w-8 bg-slate-700" /></td>
                </tr>
              ))
            ) : trips?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  <Anchor className="w-10 h-10 mx-auto mb-3 text-slate-500" />
                  No trips found
                </td>
              </tr>
            ) : (
              trips?.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-white">{trip.title}</p>
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {trip.location_name || trip.spot?.name || 'No location'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {trip.user && (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={trip.user.photos?.[0]} />
                          <AvatarFallback className="bg-slate-700 text-white text-xs">
                            {trip.user.display_name?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-slate-300 text-sm">{trip.user.display_name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-white">{format(new Date(trip.trip_date), 'MMM d, yyyy')}</p>
                      {trip.start_time && (
                        <p className="text-slate-400">{trip.start_time.slice(0, 5)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="bg-slate-700/50 text-slate-300 border-0 capitalize">
                      {trip.trip_type === 'solo' ? (
                        <span className="flex items-center gap-1">Solo</span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Group
                        </span>
                      )}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`${getStatusColor(trip.status)} border-0 capitalize`}>
                      {trip.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem 
                          onClick={() => handleViewDetails(trip)}
                          className="text-slate-300 focus:text-white focus:bg-slate-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTrip(trip)}
                          className="text-rose-400 focus:text-rose-300 focus:bg-slate-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Trip
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Trip Details</DialogTitle>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedTrip.title}</h3>
                <Badge className={`${getStatusColor(selectedTrip.status)} border-0 capitalize mt-2`}>
                  {selectedTrip.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  {format(new Date(selectedTrip.trip_date), 'PPP')}
                </div>
                {selectedTrip.start_time && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-4 h-4 text-slate-500" />
                    {selectedTrip.start_time.slice(0, 5)}
                    {selectedTrip.end_time && ` - ${selectedTrip.end_time.slice(0, 5)}`}
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-300 col-span-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  {selectedTrip.location_name || selectedTrip.spot?.name || 'No location specified'}
                </div>
              </div>

              {selectedTrip.target_species && selectedTrip.target_species.length > 0 && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Target Species</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrip.target_species.map((species, i) => (
                      <Badge key={i} variant="secondary" className="bg-slate-700 text-slate-300 border-0">
                        {species}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedTrip.notes && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Notes</p>
                  <p className="text-slate-300 text-sm">{selectedTrip.notes}</p>
                </div>
              )}

              {/* Organizer */}
              {selectedTrip.user && (
                <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedTrip.user.photos?.[0]} />
                    <AvatarFallback className="bg-slate-700 text-white">
                      {selectedTrip.user.display_name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-medium">{selectedTrip.user.display_name}</p>
                    <p className="text-slate-400 text-xs">Organizer</p>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500">Trip ID: {selectedTrip.id}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Trip</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete "{selectedTrip?.title}"? This will also remove all participants. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedTrip && deleteTrip(selectedTrip.id)}
              disabled={deletePending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletePending ? 'Deleting...' : 'Delete Trip'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
