import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, MapPin, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const addSpotSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  location_name: z.string().max(200).optional(),
  location_lat: z.coerce.number().min(-90).max(90),
  location_lng: z.coerce.number().min(-180).max(180),
  species_available: z.string().optional(),
  is_public: z.boolean().default(true),
});

type AddSpotForm = z.infer<typeof addSpotSchema>;

interface AddSpotDialogProps {
  onSpotAdded: () => void;
}

const AddSpotDialog = ({ onSpotAdded }: AddSpotDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { user } = useAuth();

  const form = useForm<AddSpotForm>({
    resolver: zodResolver(addSpotSchema),
    defaultValues: {
      name: '',
      description: '',
      location_name: '',
      location_lat: 0,
      location_lng: 0,
      species_available: '',
      is_public: true,
    },
  });

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue('location_lat', position.coords.latitude);
        form.setValue('location_lng', position.coords.longitude);
        setIsGettingLocation(false);
        toast.success('Location captured');
      },
      (error) => {
        toast.error('Could not get location');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const onSubmit = async (data: AddSpotForm) => {
    if (!user) {
      toast.error('Please sign in to add a spot');
      return;
    }

    setIsSubmitting(true);
    
    const speciesArray = data.species_available
      ? data.species_available.split(',').map(s => s.trim()).filter(Boolean)
      : null;

    const { error } = await supabase.from('fishing_spots').insert({
      name: data.name,
      description: data.description || null,
      location_name: data.location_name || null,
      location_lat: data.location_lat,
      location_lng: data.location_lng,
      species_available: speciesArray,
      is_public: data.is_public,
      created_by: user.id,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error('Failed to add spot');
      console.error(error);
      return;
    }

    toast.success('Spot added successfully!');
    form.reset();
    setOpen(false);
    onSpotAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="rounded-full shadow-lg">
          <Plus className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Fishing Spot</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spot Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Hidden Lake Pier" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What makes this spot great?" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Lake Michigan, Chicago" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Coordinates *</Label>
              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="location_lat"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input type="number" step="any" placeholder="Latitude" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location_lng"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input type="number" step="any" placeholder="Longitude" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="w-full"
              >
                {isGettingLocation ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4 mr-2" />
                )}
                Use Current Location
              </Button>
            </div>

            <FormField
              control={form.control}
              name="species_available"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fish Species (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Bass, Trout, Walleye" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="text-base">Public Spot</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Others can see this spot
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Add Spot
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSpotDialog;
