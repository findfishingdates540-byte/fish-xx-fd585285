import { Tables } from '@/integrations/supabase/types';
import SpotCard from './SpotCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin } from 'lucide-react';

interface SpotListProps {
  spots: Tables<'fishing_spots'>[];
  onSpotSelect: (spot: Tables<'fishing_spots'>) => void;
  isLoading?: boolean;
}

const SpotList = ({ spots, onSpotSelect, isLoading }: SpotListProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (spots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MapPin className="w-12 h-12 text-muted-foreground mb-3" />
        <h3 className="font-semibold text-foreground mb-1">No spots found</h3>
        <p className="text-sm text-muted-foreground">
          Be the first to add a fishing spot in this area!
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-3 p-4">
        {spots.map((spot) => (
          <SpotCard 
            key={spot.id} 
            spot={spot} 
            onClick={() => onSpotSelect(spot)} 
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default SpotList;
