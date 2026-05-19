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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [baseScore, setBaseScore] = useState<string>('');
  const [category, setCategory] = useState('');
  const [waterType, setWaterType] = useState<string>('freshwater');
  const [measurementType, setMeasurementType] = useState<string>('TL');
  const [safeRelease, setSafeRelease] = useState(false);
  const [trophyUnit, setTrophyUnit] = useState<string>('lb');
  const [trophyQuality, setTrophyQuality] = useState<string>('');
  const [trophyTrophy, setTrophyTrophy] = useState<string>('');
  const [trophyExceptional, setTrophyExceptional] = useState<string>('');
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
      setBaseScore(species.base_score != null ? String(species.base_score) : '');
      setCategory(species.category || '');
      setWaterType(species.water_type || 'freshwater');
      setMeasurementType(species.measurement_type || 'TL');
      setSafeRelease(!!species.safe_release);
      setTrophyUnit(species.trophy_unit || 'lb');
      setTrophyQuality(species.trophy_quality != null ? String(species.trophy_quality) : '');
      setTrophyTrophy(species.trophy_trophy != null ? String(species.trophy_trophy) : '');
      setTrophyExceptional(species.trophy_exceptional != null ? String(species.trophy_exceptional) : '');
    } else {
      setName('');
      setScientificName('');
      setDescription('');
      setImageUrl('');
      setBaseScore('');
      setCategory('');
      setWaterType('freshwater');
      setMeasurementType('TL');
      setSafeRelease(false);
      setTrophyUnit('lb');
      setTrophyQuality('');
      setTrophyTrophy('');
      setTrophyExceptional('');
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
      base_score: baseScore === '' ? null : Number(baseScore),
      category: category.trim() || null,
      water_type: waterType,
      measurement_type: measurementType,
      safe_release: safeRelease,
      trophy_unit: trophyUnit,
      trophy_quality: trophyQuality === '' ? null : Number(trophyQuality),
      trophy_trophy: trophyTrophy === '' ? null : Number(trophyTrophy),
      trophy_exceptional: trophyExceptional === '' ? null : Number(trophyExceptional),
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
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
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

          {/* Scoring */}
          <div className="pt-2 border-t border-slate-700">
            <p className="text-sm font-semibold text-slate-300 mt-3 mb-3">Scoring & Trophy</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="base_score">Base Score (1-10)</Label>
                <Input id="base_score" type="number" min={1} max={10} value={baseScore} onChange={(e) => setBaseScore(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Inshore Saltwater" className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label>Water Type</Label>
                <Select value={waterType} onValueChange={setWaterType}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freshwater">Freshwater</SelectItem>
                    <SelectItem value="saltwater">Saltwater</SelectItem>
                    <SelectItem value="brackish">Brackish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Measurement Type</Label>
                <Select value={measurementType} onValueChange={setMeasurementType}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TL">Total Length (TL)</SelectItem>
                    <SelectItem value="FL">Fork Length (FL)</SelectItem>
                    <SelectItem value="LJFL">Lower-Jaw Fork (LJFL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2 flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
                <div>
                  <Label className="text-white">Safe Release Species</Label>
                  <p className="text-xs text-slate-400">Estimated size allowed (no exact weigh-in needed)</p>
                </div>
                <Switch checked={safeRelease} onCheckedChange={setSafeRelease} />
              </div>
              <div className="space-y-2">
                <Label>Trophy Unit</Label>
                <Select value={trophyUnit} onValueChange={setTrophyUnit}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lb">Pounds (lb)</SelectItem>
                    <SelectItem value="in">Inches (in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div />
              <div className="space-y-2">
                <Label>Keeper / Quality</Label>
                <Input type="number" step="0.1" value={trophyQuality} onChange={(e) => setTrophyQuality(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label>Trophy</Label>
                <Input type="number" step="0.1" value={trophyTrophy} onChange={(e) => setTrophyTrophy(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Exceptional</Label>
                <Input type="number" step="0.1" value={trophyExceptional} onChange={(e) => setTrophyExceptional(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
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
