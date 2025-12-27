import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Advertisement, adTypeLabels, useCreateAd, useUpdateAd } from '@/hooks/use-admin-ads';
import { Loader2, X, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const adSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  ad_type: z.string().min(1, 'Ad type is required'),
  sponsor_name: z.string().min(1, 'Sponsor name is required').max(100),
  sponsor_logo: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
  cta_text: z.string().max(50).optional(),
  cta_url: z.string().url().optional().or(z.literal('')),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  is_active: z.boolean(),
});

type AdFormData = z.infer<typeof adSchema>;

interface AdDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ad?: Advertisement | null;
}

export function AdDialog({ isOpen, onClose, ad }: AdDialogProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const createAd = useCreateAd();
  const updateAd = useUpdateAd();

  const form = useForm<AdFormData>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: '',
      description: '',
      ad_type: 'general',
      sponsor_name: '',
      sponsor_logo: '',
      website_url: '',
      cta_text: 'Learn More',
      cta_url: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (ad) {
      form.reset({
        title: ad.title,
        description: ad.description || '',
        ad_type: ad.ad_type,
        sponsor_name: ad.sponsor_name,
        sponsor_logo: ad.sponsor_logo || '',
        website_url: ad.website_url || '',
        cta_text: ad.cta_text || 'Learn More',
        cta_url: ad.cta_url || '',
        start_date: ad.start_date,
        end_date: ad.end_date || '',
        is_active: ad.is_active,
      });
      setPhotos(ad.photos || []);
    } else {
      form.reset({
        title: '',
        description: '',
        ad_type: 'general',
        sponsor_name: '',
        sponsor_logo: '',
        website_url: '',
        cta_text: 'Learn More',
        cta_url: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        is_active: true,
      });
      setPhotos([]);
    }
  }, [ad, form]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `ads/${fileName}`;

        const { error } = await supabase.storage
          .from('spot-photos')
          .upload(filePath, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('spot-photos')
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setPhotos([...photos, ...uploadedUrls]);
      toast.success('Photos uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: AdFormData) => {
    const adData = {
      title: data.title,
      description: data.description || null,
      photos,
      ad_type: data.ad_type,
      sponsor_name: data.sponsor_name,
      sponsor_logo: data.sponsor_logo || null,
      website_url: data.website_url || null,
      cta_text: data.cta_text || 'Learn More',
      cta_url: data.cta_url || null,
      start_date: data.start_date,
      end_date: data.end_date || null,
      is_active: data.is_active,
      fishing_spot_id: null,
    };

    if (ad) {
      await updateAd.mutateAsync({ id: ad.id, ...adData });
    } else {
      await createAd.mutateAsync(adData);
    }
    onClose();
  };

  const isSubmitting = createAd.isPending || updateAd.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ad ? 'Edit Advertisement' : 'Create Advertisement'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ad title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ad_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(adTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ad description..." 
                      className="resize-none" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Photos */}
            <div className="space-y-2">
              <FormLabel>Photos</FormLabel>
              <div className="flex flex-wrap gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative w-20 h-20">
                    <img
                      src={photo}
                      alt={`Ad photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                </label>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Sponsor Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sponsor_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sponsor Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sponsor_logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sponsor Logo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website_url"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Call to Action</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cta_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Button Text</FormLabel>
                      <FormControl>
                        <Input placeholder="Learn More" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cta_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Button URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Schedule</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel className="text-base">Active</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Enable this ad to show in the feed
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

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {ad ? 'Update' : 'Create'} Advertisement
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
