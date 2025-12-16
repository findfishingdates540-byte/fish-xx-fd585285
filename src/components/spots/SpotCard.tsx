import { MapPin, Star, Fish } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SpotCardProps {
  spot: Tables<'fishing_spots'>;
  onClick?: () => void;
}

const SpotCard = ({ spot, onClick }: SpotCardProps) => {
  return (
    <Card 
      className="cursor-pointer card-hover border-border"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{spot.name}</h3>
            {spot.location_name && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{spot.location_name}</span>
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-foreground">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">
              {spot.rating_avg ? Number(spot.rating_avg).toFixed(1) : 'N/A'}
            </span>
          </div>
        </div>

        {spot.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {spot.description}
          </p>
        )}

        {spot.species_available && spot.species_available.length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Fish className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            {spot.species_available.slice(0, 3).map((species, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {species}
              </Badge>
            ))}
            {spot.species_available.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{spot.species_available.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          {spot.is_verified && (
            <Badge variant="default" className="text-xs">Verified</Badge>
          )}
          {spot.rating_count && spot.rating_count > 0 && (
            <span>({spot.rating_count} reviews)</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SpotCard;
