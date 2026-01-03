import { useState } from 'react';
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

  const resetForm = () => {
    setName('');
    setLocationName('');
    setLocationLat('');
    setLocationLng('');
    setDescription('');
    setIsPublic(true);
    setIsVerified(false);
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
