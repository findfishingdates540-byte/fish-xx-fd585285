import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Star, 
  Calendar, 
  User,
  CheckCircle,
  Globe,
  Lock,
  Fish
} from 'lucide-react';

interface SpotDetailsModalProps {
  spot: {
    id: string;
    name: string;
    description: string | null;
    location_name: string | null;
    location_lat: number;
    location_lng: number;
    photos: string[] | null;
    species_available: string[] | null;
    is_public: boolean | null;
    is_verified: boolean | null;
    rating_avg: number | null;
    rating_count: number | null;
    created_at: string;
    creator: {
      id: string;
      display_name: string | null;
      photos: string[] | null;
    } | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpotDetailsModal({ spot, open, onOpenChange }: SpotDetailsModalProps) {
  if (!spot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Spot Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Photo */}
          {spot.photos && spot.photos.length > 0 ? (
            <div className="aspect-video rounded-lg overflow-hidden bg-slate-800">
              <img 
                src={spot.photos[0]} 
                alt={spot.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video rounded-lg bg-slate-800 flex items-center justify-center">
              <MapPin className="w-12 h-12 text-slate-600" />
            </div>
          )}

          {/* Spot Header */}
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-semibold">{spot.name}</h3>
                <p className="text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {spot.location_name || 'Unknown location'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-current" />
                <span className="text-lg font-medium">{spot.rating_avg?.toFixed(1) || 'N/A'}</span>
                <span className="text-slate-400">({spot.rating_count || 0} reviews)</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {spot.is_verified && (
                <Badge className="bg-cyan-500/20 text-cyan-400 border-0 gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </Badge>
              )}
              <Badge className={spot.is_public 
                ? 'bg-emerald-500/20 text-emerald-400 border-0 gap-1'
                : 'bg-amber-500/20 text-amber-400 border-0 gap-1'
              }>
                {spot.is_public ? (
                  <>
                    <Globe className="w-3 h-3" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    Private
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* Description */}
          {spot.description && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-1">Description</h4>
              <p className="text-slate-300">{spot.description}</p>
            </div>
          )}

          {/* Species Available */}
          {spot.species_available && spot.species_available.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-1">
                <Fish className="w-4 h-4" />
                Species Available
              </h4>
              <div className="flex flex-wrap gap-2">
                {spot.species_available.map((species, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary"
                    className="bg-slate-700 text-slate-300 border-0"
                  >
                    {species}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Coordinates */}
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-1">Coordinates</h4>
            <p className="text-slate-300 font-mono text-sm">
              {spot.location_lat.toFixed(6)}, {spot.location_lng.toFixed(6)}
            </p>
          </div>

          {/* Creator & Date */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            {spot.creator ? (
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={spot.creator.photos?.[0]} />
                  <AvatarFallback className="bg-slate-700 text-white text-sm">
                    {spot.creator.display_name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-slate-300">{spot.creator.display_name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">Creator</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400">
                <User className="w-4 h-4" />
                <span className="text-sm">Unknown creator</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                Created {format(new Date(spot.created_at), 'MMM d, yyyy')}
              </span>
            </div>
          </div>

          {/* Additional Photos */}
          {spot.photos && spot.photos.length > 1 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">All Photos</h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {spot.photos.map((photo, i) => (
                  <img 
                    key={i}
                    src={photo} 
                    alt={`Photo ${i + 1}`}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Spot ID */}
          <div className="text-xs text-slate-500">
            Spot ID: {spot.id}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
