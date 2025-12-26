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
  Crown, 
  Calendar, 
  MapPin, 
  Mail, 
  User, 
  Clock,
  Ban
} from 'lucide-react';

interface UserDetailsModalProps {
  user: {
    id: string;
    display_name: string | null;
    email: string | null;
    photos: string[] | null;
    account_mode: string | null;
    is_premium: boolean | null;
    is_active: boolean | null;
    is_banned: boolean | null;
    created_at: string;
    premium_expires_at: string | null;
    location_name: string | null;
    bio: string | null;
    gender: string | null;
    date_of_birth: string | null;
    onboarding_completed: boolean | null;
    last_active_at: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsModal({ user, open, onOpenChange }: UserDetailsModalProps) {
  if (!user) return null;

  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.photos?.[0]} />
              <AvatarFallback className="bg-slate-700 text-white text-2xl">
                {user.display_name?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{user.display_name || 'Unknown'}</h3>
              <p className="text-slate-400 text-sm">{user.email || 'No email'}</p>
              <p className="text-slate-500 text-xs mt-1">ID: {user.id}</p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {user.is_banned && (
                  <Badge variant="destructive" className="gap-1">
                    <Ban className="w-3 h-3" />
                    Banned
                  </Badge>
                )}
                {user.is_premium && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-0 gap-1">
                    <Crown className="w-3 h-3" />
                    Premium
                  </Badge>
                )}
                <Badge 
                  className={
                    user.account_mode === 'dating' 
                      ? 'bg-rose-500/20 text-rose-400 border-0'
                      : user.account_mode === 'fishing'
                      ? 'bg-emerald-500/20 text-emerald-400 border-0'
                      : 'bg-violet-500/20 text-violet-400 border-0'
                  }
                >
                  {user.account_mode || 'N/A'}
                </Badge>
                <Badge 
                  className={
                    user.is_active 
                      ? 'bg-emerald-500/20 text-emerald-400 border-0'
                      : 'bg-slate-500/20 text-slate-400 border-0'
                  }
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-1">Bio</h4>
              <p className="text-slate-300 text-sm">{user.bio}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-slate-300">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-sm">
                {user.gender ? user.gender.replace('_', ' ') : 'Not specified'}
                {user.date_of_birth && `, ${calculateAge(user.date_of_birth)} years`}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span className="text-sm">{user.location_name || 'No location'}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-sm">
                Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-sm">
                Last active {user.last_active_at 
                  ? format(new Date(user.last_active_at), 'MMM d, yyyy')
                  : 'Never'
                }
              </span>
            </div>

            {user.is_premium && user.premium_expires_at && (
              <div className="col-span-2 flex items-center gap-2 text-amber-400">
                <Crown className="w-4 h-4" />
                <span className="text-sm">
                  Premium expires {format(new Date(user.premium_expires_at), 'MMM d, yyyy')}
                </span>
              </div>
            )}
          </div>

          {/* Photos */}
          {user.photos && user.photos.length > 1 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Photos</h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {user.photos.map((photo, i) => (
                  <img 
                    key={i}
                    src={photo} 
                    alt={`Photo ${i + 1}`}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Onboarding Status */}
          <div className="text-sm text-slate-400">
            Onboarding: {user.onboarding_completed ? 'Completed' : 'Not completed'}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
