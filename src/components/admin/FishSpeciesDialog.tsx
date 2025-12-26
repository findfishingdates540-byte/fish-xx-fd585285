import { useState, useEffect } from 'react';
import { z } from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateFishSpecies, useUpdateFishSpecies, type FishSpecies } from '@/hooks/use-fish-species';

const fishSpeciesSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  scientific_name: z.string().trim().max(100, 'Scientific name must be less than 100 characters').optional(),
  description: z.string().trim().max(500, 'Description must be less than 500 characters').optional(),
  image_url: z.string().trim().url('Must be a valid URL').max(500, 'URL must be less than 500 characters').optional().or(z.literal('')),
});

interface FishSpeciesDialogProps {
  species: FishSpecies | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FishSpeciesDialog({ species, open, onOpenChange }: FishSpeciesDialogProps) {
  const [name, setName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: createSpecies, isPending: createPending } = useCreateFishSpecies();
  const { mutate: updateSpecies, isPending: updatePending } = useUpdateFishSpecies();

  const isEditing = !!species;
  const isPending = createPending || updatePending;

  useEffect(() => {
    if (species) {
      setName(species.name || '');
      setScientificName(species.scientific_name || '');
      setDescription(species.description || '');
      setImageUrl(species.image_url || '');
    } else {
      setName('');
      setScientificName('');
      setDescription('');
      setImageUrl('');
    }
    setErrors({});
  }, [species, open]);

  const handleSubmit = () => {
    const result = fishSpeciesSchema.safeParse({
      name,
      scientific_name: scientificName || undefined,
      description: description || undefined,
      image_url: imageUrl || undefined,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    const input = {
      name: result.data.name,
      scientific_name: result.data.scientific_name,
      description: result.data.description,
      image_url: result.data.image_url || undefined,
    };

    if (isEditing && species) {
      updateSpecies(
        { id: species.id, input },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createSpecies(input, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Fish Species' : 'Add Fish Species'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Largemouth Bass"
              className="bg-slate-800 border-slate-700 text-white"
              maxLength={100}
            />
            {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="scientific_name">Scientific Name</Label>
            <Input
              id="scientific_name"
              value={scientificName}
              onChange={(e) => setScientificName(e.target.value)}
              placeholder="e.g., Micropterus salmoides"
              className="bg-slate-800 border-slate-700 text-white"
              maxLength={100}
            />
            {errors.scientific_name && <p className="text-sm text-red-400">{errors.scientific_name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the species..."
              className="bg-slate-800 border-slate-700 text-white resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-slate-500">{description.length}/500</p>
            {errors.description && <p className="text-sm text-red-400">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/fish-image.jpg"
              className="bg-slate-800 border-slate-700 text-white"
              maxLength={500}
            />
            {errors.image_url && <p className="text-sm text-red-400">{errors.image_url}</p>}
            {imageUrl && !errors.image_url && (
              <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden bg-slate-800">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isPending ? 'Saving...' : isEditing ? 'Update Species' : 'Add Species'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
