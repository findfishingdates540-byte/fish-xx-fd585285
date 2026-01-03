import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditAction } from '@/hooks/use-audit-logs';
import { useFishSpecies } from '@/hooks/use-fish-species';
import { Upload, X, Loader2, Fish } from 'lucide-react';

interface EditSpotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spot: {
    id: string;
    name: string;
    location_name: string | null;
    location_lat: number;
    location_lng: number;
    description: string | null;
    is_public: boolean | null;
    is_verified: boolean | null;
    photos: string[] | null;
    species_available: string[] | null;
  } | null;
}

export function EditSpotDialog({ open, onOpenChange, spot }: EditSpotDialogProps) {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();
  const { data: fishSpecies } = useFishSpecies();
  
  const [name, setName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (spot) {
      setName(spot.name);
      setLocationName(spot.location_name || '');
      setLocationLat(spot.location_lat.toString());
      setLocationLng(spot.location_lng.toString());
      setDescription(spot.description || '');
      setIsPublic(spot.is_public ?? true);
      setIsVerified(spot.is_verified ?? false);
      setPhotos(spot.photos || []);
      setSelectedSpecies(spot.species_available || []);
    }
  }, [spot]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newPhotos: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('spot-photos')
          .upload(fileName, file);

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('spot-photos')
          .getPublicUrl(fileName);

        newPhotos.push(publicUrl);
      }

      if (newPhotos.length > 0) {
        setPhotos(prev => [...prev, ...newPhotos]);
        toast.success(`Uploaded ${newPhotos.length} photo(s)`);
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (url: string) => {
    setPhotos(prev => prev.filter(p => p !== url));
  };

  const toggleSpecies = (speciesName: string) => {
    setSelectedSpecies(prev => 
      prev.includes(speciesName) 
        ? prev.filter(s => s !== speciesName)
        : [...prev, speciesName]
    );
  };

  const { mutate: updateSpot, isPending } = useMutation({
    mutationFn: async () => {
      if (!spot) throw new Error('No spot to update');

      const { data, error } = await supabase
        .from('fishing_spots')
        .update({
          name,
          location_name: locationName || null,
          location_lat: parseFloat(locationLat),
          location_lng: parseFloat(locationLng),
          description: description || null,
          is_public: isPublic,
          is_verified: isVerified,
          photos: photos.length > 0 ? photos : null,
          species_available: selectedSpecies.length > 0 ? selectedSpecies : null,
        })
        .eq('id', spot.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-spots'] });
      toast.success('Spot updated successfully');
      await logAction('spot_updated', 'spot', data.id, { name, isPublic, isVerified });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to update spot: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Spot name is required');
      return;
    }
    
    const lat = parseFloat(locationLat);
    const lng = parseFloat(locationLng);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast.error('Invalid latitude (must be between -90 and 90)');
      return;
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast.error('Invalid longitude (must be between -180 and 180)');
      return;
    }

    updateSpot();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Fishing Spot</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Spot Name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Crystal Lake Marina"
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-locationName">Location Name</Label>
              <Input
                id="edit-locationName"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Denver, Colorado"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-lat">Latitude *</Label>
                <Input
                  id="edit-lat"
                  type="number"
                  step="any"
                  value={locationLat}
                  onChange={(e) => setLocationLat(e.target.value)}
                  placeholder="39.7392"
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lng">Longitude *</Label>
                <Input
                  id="edit-lng"
                  type="number"
                  step="any"
                  value={locationLng}
                  onChange={(e) => setLocationLng(e.target.value)}
                  placeholder="-104.9903"
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A beautiful lakeside fishing spot..."
                className="bg-slate-800 border-slate-700 text-white resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Fish className="w-4 h-4" />
                Species Available
              </Label>
              {fishSpecies && fishSpecies.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-800 rounded-md border border-slate-700">
                  {fishSpecies.map((species) => (
                    <div key={species.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`edit-species-${species.id}`}
                        checked={selectedSpecies.includes(species.name)}
                        onCheckedChange={() => toggleSpecies(species.name)}
                      />
                      <label
                        htmlFor={`edit-species-${species.id}`}
                        className="text-sm text-slate-300 cursor-pointer"
                      >
                        {species.name}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No species available</p>
              )}
              {selectedSpecies.length > 0 && (
                <p className="text-xs text-slate-400">{selectedSpecies.length} species selected</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Photos</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Upload Photos</>
                )}
              </Button>
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {photos.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-full h-20 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removePhoto(url)}
                        className="absolute top-1 right-1 bg-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-isPublic">Public Spot</Label>
              <Switch
                id="edit-isPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-isVerified">Verified Spot</Label>
              <Switch
                id="edit-isVerified"
                checked={isVerified}
                onCheckedChange={setIsVerified}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
