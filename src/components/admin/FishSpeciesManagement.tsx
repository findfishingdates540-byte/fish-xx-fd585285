import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Fish, Upload, CheckSquare, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFishSpecies, useDeleteFishSpecies, type FishSpecies } from '@/hooks/use-fish-species';
import { FishSpeciesDialog } from './FishSpeciesDialog';
import { FishSpeciesImportDialog } from './FishSpeciesImportDialog';

export function FishSpeciesManagement() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<FishSpecies | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const { data: species, isLoading } = useFishSpecies();
  const { mutate: deleteSpecies, isPending: deletePending } = useDeleteFishSpecies();

  const filteredSpecies = species?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.scientific_name?.toLowerCase().includes(search.toLowerCase())
  );

  const allFilteredSelected = useMemo(() => {
    if (!filteredSpecies?.length) return false;
    return filteredSpecies.every(s => selectedIds.has(s.id));
  }, [filteredSpecies, selectedIds]);

  const someSelected = selectedIds.size > 0;

  const handleAdd = () => {
    setSelectedSpecies(null);
    setDialogOpen(true);
  };

  const handleEdit = (s: FishSpecies) => {
    setSelectedSpecies(s);
    setDialogOpen(true);
  };

  const handleDelete = (s: FishSpecies) => {
    setSelectedSpecies(s);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedSpecies) {
      deleteSpecies(selectedSpecies.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSelectedIds(prev => {
            const next = new Set(prev);
            next.delete(selectedSpecies.id);
            return next;
          });
        },
      });
    }
  };

  const toggleSelectAll = () => {
    if (!filteredSpecies) return;
    if (allFilteredSelected) {
      // Deselect all filtered
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredSpecies.forEach(s => next.delete(s.id));
        return next;
      });
    } else {
      // Select all filtered
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredSpecies.forEach(s => next.add(s.id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    
    const idsToDelete = Array.from(selectedIds);
    let successCount = 0;
    
    for (const id of idsToDelete) {
      try {
        await new Promise<void>((resolve, reject) => {
          deleteSpecies(id, {
            onSuccess: () => {
              successCount++;
              resolve();
            },
            onError: reject,
          });
        });
      } catch (error) {
        console.error('Failed to delete species:', id, error);
      }
    }
    
    setSelectedIds(new Set());
    setBulkDeleting(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search species..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        {someSelected && (
          <Button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="bg-red-600 hover:bg-red-700 text-white gap-2"
          >
            {bulkDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete ({selectedIds.size})
              </>
            )}
          </Button>
        )}
        <Button
          onClick={() => setImportDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Upload className="w-4 h-4" />
          Import
        </Button>
        <Button
          onClick={handleAdd}
          className="bg-emerald-600 hover:bg-emerald-700 gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Species
        </Button>
      </div>

      {/* Species List */}
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-700">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg bg-slate-700" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-40 bg-slate-700 mb-2" />
                  <Skeleton className="h-4 w-32 bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredSpecies?.length === 0 ? (
          <div className="p-8 text-center">
            <Fish className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">
              {search ? 'No species match your search' : 'No fish species added yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700 max-h-[500px] overflow-y-auto">
            {/* Select All Header */}
            {filteredSpecies && filteredSpecies.length > 0 && (
              <div className="p-3 bg-slate-800/50 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-700">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={toggleSelectAll}
                  className="border-slate-500 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <span className="text-sm text-slate-400">
                  {allFilteredSelected ? 'Deselect all' : 'Select all'} ({filteredSpecies.length})
                </span>
              </div>
            )}
            {filteredSpecies?.map((s) => (
              <div
                key={s.id}
                className={`p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors ${
                  selectedIds.has(s.id) ? 'bg-slate-800/30' : ''
                }`}
              >
                {/* Checkbox */}
                <Checkbox
                  checked={selectedIds.has(s.id)}
                  onCheckedChange={() => toggleSelect(s.id)}
                  className="border-slate-500 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                
                {/* Image */}
                <div className="w-12 h-12 rounded-lg bg-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {s.image_url ? (
                    <img
                      src={s.image_url}
                      alt={s.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = 
                          '<svg class="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                      }}
                    />
                  ) : (
                    <Fish className="w-6 h-6 text-slate-500" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{s.name}</p>
                  {s.scientific_name && (
                    <p className="text-sm text-slate-400 italic truncate">{s.scientific_name}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(s)}
                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(s)}
                    className="text-slate-400 hover:text-rose-400 hover:bg-slate-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Species count */}
      {!isLoading && species && species.length > 0 && (
        <p className="text-sm text-slate-500">
          {filteredSpecies?.length} of {species.length} species
        </p>
      )}

      {/* Add/Edit Dialog */}
      <FishSpeciesDialog
        species={selectedSpecies}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Import Dialog */}
      <FishSpeciesImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Fish Species</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete <span className="text-white font-medium">"{selectedSpecies?.name}"</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
