import { useState } from 'react';
import { Search, MoreVertical, Fish, MapPin, Calendar, Eye, Trash2, User, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Catch {
  id: string;
  species_name: string | null;
  weight_lbs: number | null;
  length_in: number | null;
  photos: string[] | null;
  cover_photo_url: string | null;
  measurement_photo_url: string | null;
  video_url?: string | null;
  notes: string | null;
  caught_at: string | null;
  created_at: string;
  bait_used: string | null;
  is_verified: boolean | null;
  species_id: string | null;
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

export default function AdminCatches() {
  const [search, setSearch] = useState('');
  const [selectedCatch, setSelectedCatch] = useState<Catch | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const queryClient = useQueryClient();

  const { data: catches, isLoading } = useQuery({
    queryKey: ['admin-catches', search],
    queryFn: async (): Promise<Catch[]> => {
      let query = supabase
        .from('catches')
        .select(`
          *,
          user:profiles!catches_user_id_fkey(id, display_name, photos),
          spot:fishing_spots!catches_fishing_spot_id_fkey(id, name, location_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (search) {
        query = query.or(`species_name.ilike.%${search}%,notes.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });

  const rowIds = (catches || []).map((c) => c.id);
  const { data: extraPhotosByCatch = {} } = useQuery({
    queryKey: ['admin-catches-extras', rowIds.join(',')],
    enabled: rowIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('catch_photos')
        .select('catch_id, photo_url, photo_type')
        .in('catch_id', rowIds);
      const map: Record<string, { url: string; label: string }[]> = {};
      (data || []).forEach((p: any) => {
        map[p.catch_id] = map[p.catch_id] || [];
        map[p.catch_id].push({ url: p.photo_url, label: p.photo_type || 'Photo' });
      });
      return map;
    },
  });

  const collectPhotos = (c: Catch): { url: string; label: string }[] => {
    const list: { url: string; label: string }[] = [];
    if (c.cover_photo_url) list.push({ url: c.cover_photo_url, label: 'Catch photo' });
    if (c.measurement_photo_url) list.push({ url: c.measurement_photo_url, label: 'Measurement photo' });
    (c.photos || []).forEach((url, i) => {
      if (url && url !== c.cover_photo_url && url !== c.measurement_photo_url) {
        list.push({ url, label: `Additional photo ${i + 1}` });
      }
    });
    ((extraPhotosByCatch as Record<string, { url: string; label: string }[]>)[c.id] || []).forEach((p) => {
      if (!list.some((x) => x.url === p.url)) list.push(p);
    });
    return list;
  };

  const { mutate: deleteCatch, isPending: deletePending } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('catches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catches'] });
      toast.success('Catch deleted successfully');
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to delete catch: ${error.message}`);
    },
  });

  const { mutate: toggleVerify, isPending: verifyPending } = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase
        .from('catches')
        .update({ is_verified: verified })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-catches'] });
      toast.success(vars.verified ? 'Catch verified — counted in scoring' : 'Verification removed');
      setSelectedCatch((c) => (c ? { ...c, is_verified: vars.verified } : c));
    },
    onError: (e: any) => toast.error(`Verify failed: ${e.message}`),
  });

  const handleViewDetails = (c: Catch) => {
    setSelectedCatch(c);
    setActivePhotoIdx(0);
    setDetailsOpen(true);
  };

  const handleDeleteCatch = (c: Catch) => {
    setSelectedCatch(c);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Fish Catches</h1>
          <p className="text-slate-400 mt-1">View and moderate all fish catches on the platform</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by species or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Catches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-72 bg-slate-800" />
          ))
        ) : catches?.length === 0 ? (
          <div className="col-span-full bg-slate-800/50 rounded-xl p-12 text-center border border-slate-700/50">
            <Fish className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No catches found</h3>
            <p className="text-slate-400">No fish catches match your search.</p>
          </div>
        ) : (
          catches?.map((c) => (
            <div
              key={c.id}
              className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-slate-600 transition-colors"
            >
              {/* Catch Image */}
              <div className="aspect-video bg-slate-700 relative cursor-pointer" onClick={() => handleViewDetails(c)}>
                {(() => {
                  const photos = collectPhotos(c);
                  if (photos.length === 0) {
                    return (
                      <div className="w-full h-full flex items-center justify-center">
                        <Fish className="w-8 h-8 text-slate-500" />
                      </div>
                    );
                  }
                  return (
                    <>
                      <img src={photos[0].url} alt={c.species_name || 'Catch'} className="w-full h-full object-cover" />
                      {photos.length > 1 && (
                        <span className="absolute bottom-2 right-2 bg-black/70 text-[10px] text-white px-1.5 py-0.5 rounded">
                          +{photos.length - 1} more
                        </span>
                      )}
                    </>
                  );
                })()}
                <Badge className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-400 border-0">
                  {c.species_name || 'Unknown Species'}
                </Badge>
                {c.is_verified && (
                  <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </div>
                )}
              </div>

              {/* Catch Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {c.weight_lbs && (
                        <span className="text-white font-medium">{c.weight_lbs} lbs</span>
                      )}
                      {c.length_in && (
                        <span className="text-slate-400">• {c.length_in} in</span>
                      )}
                    </div>
                    {c.spot && (
                      <p className="text-sm text-slate-400 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {c.spot.name}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white flex-shrink-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem 
                        onClick={() => handleViewDetails(c)}
                        className="text-slate-300 focus:text-white focus:bg-slate-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toggleVerify({ id: c.id, verified: !c.is_verified })}
                        disabled={verifyPending}
                        className={c.is_verified
                          ? "text-amber-400 focus:text-amber-300 focus:bg-slate-700"
                          : "text-emerald-400 focus:text-emerald-300 focus:bg-slate-700"}
                      >
                        {c.is_verified ? (
                          <><XCircle className="w-4 h-4 mr-2" />Unverify</>
                        ) : (
                          <><CheckCircle2 className="w-4 h-4 mr-2" />Verify Catch</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteCatch(c)}
                        className="text-rose-400 focus:text-rose-300 focus:bg-slate-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Catch
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* User & Date */}
                <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-700">
                  {c.user && (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={c.user.photos?.[0]} />
                        <AvatarFallback className="bg-slate-700 text-white text-xs">
                          {c.user.display_name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-slate-400 truncate max-w-24">{c.user.display_name}</span>
                    </div>
                  )}
                  <span className="text-slate-500">
                    {format(new Date(c.caught_at || c.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Catch Details</DialogTitle>
          </DialogHeader>
          {selectedCatch && (
            <div className="space-y-4">
              {/* Verify toggle in details */}
              <Button
                onClick={() => toggleVerify({ id: selectedCatch.id, verified: !selectedCatch.is_verified })}
                disabled={verifyPending}
                className={`w-full ${selectedCatch.is_verified
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}
              >
                {selectedCatch.is_verified ? (
                  <><XCircle className="w-4 h-4 mr-2" />Unverify (remove from scoring)</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" />Verify Catch (add to scoring)</>
                )}
              </Button>
              {(selectedCatch.cover_photo_url || selectedCatch.photos?.[0] || selectedCatch.measurement_photo_url) && (
                <img 
                  src={selectedCatch.cover_photo_url || selectedCatch.photos?.[0] || selectedCatch.measurement_photo_url || ''} 
                  alt="Catch" 
                  className="w-full aspect-video object-cover rounded-lg"
                />
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Species</p>
                  <p className="text-white font-medium">{selectedCatch.species_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Weight</p>
                  <p className="text-white font-medium">{selectedCatch.weight_lbs ? `${selectedCatch.weight_lbs} lbs` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Length</p>
                  <p className="text-white font-medium">{selectedCatch.length_in ? `${selectedCatch.length_in} in` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Bait Used</p>
                  <p className="text-white font-medium">{selectedCatch.bait_used || 'N/A'}</p>
                </div>
              </div>
              {selectedCatch.notes && (
                <div>
                  <p className="text-slate-400 text-sm mb-1">Notes</p>
                  <p className="text-slate-300 text-sm">{selectedCatch.notes}</p>
                </div>
              )}
              {selectedCatch.user && (
                <div className="flex items-center gap-3 pt-3 border-t border-slate-700">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={selectedCatch.user.photos?.[0]} />
                    <AvatarFallback className="bg-slate-700 text-white">
                      {selectedCatch.user.display_name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white text-sm font-medium">{selectedCatch.user.display_name}</p>
                    <p className="text-slate-400 text-xs">Caught on {format(new Date(selectedCatch.caught_at || selectedCatch.created_at), 'PPP')}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Catch</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this catch? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedCatch && deleteCatch(selectedCatch.id)}
              disabled={deletePending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletePending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
