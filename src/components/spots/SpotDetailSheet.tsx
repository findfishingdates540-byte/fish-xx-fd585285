import { useState } from 'react';
import { MapPin, Star, Fish, Clock, User, Navigation, X } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SpotDetailSheetProps {
  spot: Tables<'fishing_spots'> | null;
  open: boolean;
  onClose: () => void;
}

const SpotDetailSheet = ({ spot, open, onClose }: SpotDetailSheetProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [userRating, setUserRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: ratings } = useQuery({
    queryKey: ['spot-ratings', spot?.id],
    queryFn: async () => {
      if (!spot) return [];
      const { data, error } = await supabase
        .from('spot_ratings')
        .select('*')
        .eq('spot_id', spot.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!spot,
  });

  const submitRating = async () => {
    if (!user || !spot || userRating === 0) return;
    
    setIsSubmitting(true);
    
    const { error } = await supabase.from('spot_ratings').insert({
      spot_id: spot.id,
      user_id: user.id,
      rating: userRating,
      review: review || null,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error('Failed to submit rating');
      return;
    }

    toast.success('Rating submitted!');
    setUserRating(0);
    setReview('');
    queryClient.invalidateQueries({ queryKey: ['spot-ratings', spot.id] });
    queryClient.invalidateQueries({ queryKey: ['fishing-spots'] });
  };

  const openDirections = () => {
    if (!spot) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.location_lat},${spot.location_lng}`;
    window.open(url, '_blank');
  };

  if (!spot) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-xl">{spot.name}</SheetTitle>
              {spot.location_name && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {spot.location_name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 bg-foreground text-background px-3 py-1 rounded-full">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-semibold">
                {spot.rating_avg ? Number(spot.rating_avg).toFixed(1) : 'N/A'}
              </span>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto pb-20">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={openDirections}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Directions
            </Button>
          </div>

          {/* Description */}
          {spot.description && (
            <div>
              <h3 className="font-semibold mb-2">About this spot</h3>
              <p className="text-muted-foreground text-sm">{spot.description}</p>
            </div>
          )}

          {/* Species */}
          {spot.species_available && spot.species_available.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Fish className="w-4 h-4" />
                Fish Species
              </h3>
              <div className="flex flex-wrap gap-2">
                {spot.species_available.map((species, idx) => (
                  <Badge key={idx} variant="secondary">{species}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {spot.is_verified && (
              <Badge variant="default">Verified Spot</Badge>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Added {format(new Date(spot.created_at), 'MMM d, yyyy')}
            </span>
            {spot.rating_count && spot.rating_count > 0 && (
              <span>{spot.rating_count} reviews</span>
            )}
          </div>

          <Separator />

          {/* Add Rating */}
          {user && (
            <div>
              <h3 className="font-semibold mb-3">Rate this spot</h3>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    className="p-1"
                  >
                    <Star 
                      className={`w-8 h-8 transition-colors ${
                        star <= userRating 
                          ? 'fill-foreground text-foreground' 
                          : 'text-muted-foreground'
                      }`} 
                    />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Share your experience (optional)"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="mb-3 resize-none"
              />
              <Button 
                onClick={submitRating} 
                disabled={userRating === 0 || isSubmitting}
                className="w-full"
              >
                Submit Rating
              </Button>
            </div>
          )}

          {/* Reviews */}
          {ratings && ratings.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Reviews</h3>
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <div key={rating.id} className="border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star}
                            className={`w-4 h-4 ${
                              star <= rating.rating 
                                ? 'fill-foreground text-foreground' 
                                : 'text-muted'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(rating.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {rating.review && (
                      <p className="text-sm text-muted-foreground">{rating.review}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SpotDetailSheet;
