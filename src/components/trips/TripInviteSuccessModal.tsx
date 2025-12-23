import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock, CalendarCheck, X, Fish } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface TripInviteSuccessModalProps {
  open: boolean;
  onClose: () => void;
  buddyName: string;
  buddyPhoto?: string;
  spotName: string;
  spotLat?: number;
  spotLng?: number;
  tripDate: Date;
  tripTime: string;
}

export function TripInviteSuccessModal({
  open,
  onClose,
  buddyName,
  buddyPhoto,
  spotName,
  spotLat,
  spotLng,
  tripDate,
  tripTime,
}: TripInviteSuccessModalProps) {
  const navigate = useNavigate();

  const handleViewTrips = () => {
    navigate('/app/trips');
    onClose();
  };

  const handleContinueBrowsing = () => {
    onClose();
    navigate(-1);
  };

  // Generate static map URL
  const mapUrl = spotLat && spotLng 
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+0ea5e9(${spotLng},${spotLat})/${spotLng},${spotLat},11,0/400x200@2x?access_token=pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNscXBsaXNtZTAxMDkycXBpbzVwbWNlMWEifQ.placeholder`
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 border-0 bg-background overflow-hidden rounded-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mb-4">
            <CalendarCheck className="h-8 w-8 text-sky-500" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-2">It's a Catch! Invite Sent.</h2>
          <p className="text-muted-foreground mb-6">
            We've sent your fishing date proposal to {buddyName}. Fingers crossed for a bite!
          </p>

          {/* Map & Info Card */}
          <div className="w-full bg-muted/50 rounded-xl overflow-hidden mb-6">
            {/* Map */}
            <div className="relative h-32 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20">
              {/* Fallback map illustration */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <MapPin className="h-16 w-16 text-primary" />
              </div>
              
              {/* Location badge */}
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm shadow-sm">
                  <MapPin className="h-3 w-3 mr-1 text-primary" />
                  {spotName}
                </Badge>
              </div>

              {/* Avatar overlaid on map */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-4 border-background shadow-lg">
                    <AvatarImage src={buddyPhoto} alt={buddyName} className="object-cover" />
                    <AvatarFallback className="text-lg bg-muted">
                      {buddyName?.charAt(0) || 'B'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                    <Fish className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
              </div>
            </div>

            {/* Name and details */}
            <div className="pt-10 pb-4 px-4">
              <h3 className="font-semibold text-lg mb-3">{buddyName}</h3>
              
              {/* Date and Time badges */}
              <div className="flex items-center justify-center gap-3">
                <Badge variant="outline" className="px-3 py-1.5 text-sm font-normal">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  {format(tripDate, 'EEE, MMM d')}
                </Badge>
                <Badge variant="outline" className="px-3 py-1.5 text-sm font-normal">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  {tripTime}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full space-y-3">
            <Button 
              onClick={handleViewTrips}
              className="w-full h-12 text-base"
            >
              <CalendarCheck className="h-5 w-5 mr-2" />
              View Upcoming Dates
            </Button>
            <button
              onClick={handleContinueBrowsing}
              className="w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
