import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditAction } from '@/hooks/use-audit-logs';
import { Upload, X, Loader2 } from 'lucide-react';

interface AddSpotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSpotDialog({ open, onOpenChange }: AddSpotDialogProps) {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();
  
  const [name, setName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setName('');
    setLocationName('');
    setLocationLat('');
    setLocationLng('');
    setDescription('');
    setIsPublic(true);
    setIsVerified(false);
    setPhotos([]);
  };

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

  const { mutate: addSpot, isPending } = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('fishing_spots')
        .insert({
          name,
          location_name: locationName || null,
          location_lat: parseFloat(locationLat),
          location_lng: parseFloat(locationLng),
          description: description || null,
          is_public: isPublic,
          is_verified: isVerified,
          created_by: user.id,
          photos: photos.length > 0 ? photos : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-spots'] });
      toast.success('Spot added successfully');
      await logAction('spot_created', 'spot', data.id, { name, isPublic, isVerified });
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to add spot: ${error.message}`);
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

    addSpot();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Fishing Spot</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Spot Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Crystal Lake Marina"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationName">Location Name</Label>
            <Input
              id="locationName"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Denver, Colorado"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude *</Label>
              <Input
                id="lat"
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
              <Label htmlFor="lng">Longitude *</Label>
              <Input
                id="lng"
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A beautiful lakeside fishing spot..."
              className="bg-slate-800 border-slate-700 text-white resize-none"
              rows={3}
            />
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
            <Label htmlFor="isPublic">Public Spot</Label>
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isVerified">Verified Spot</Label>
            <Switch
              id="isVerified"
              checked={isVerified}
              onCheckedChange={setIsVerified}
            />
          </div>

          <DialogFooter>
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
              {isPending ? 'Adding...' : 'Add Spot'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
