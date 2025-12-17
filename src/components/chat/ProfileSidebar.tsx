import { MapPin, Heart, Briefcase, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProfileSidebarProps {
  name: string;
  age: number;
  photo: string;
  isOnline?: boolean;
  location?: string;
  bio?: string;
  interests?: string[];
  photos?: string[];
  className?: string;
}

export function ProfileSidebar({
  name,
  age,
  photo,
  isOnline,
  location,
  bio,
  interests = [],
  photos = [],
  className,
}: ProfileSidebarProps) {
  return (
    <aside className={cn("flex flex-col bg-background overflow-y-auto", className)}>
      <div className="p-6">
        {/* Profile Photo */}
        <div className="flex justify-center mb-4">
          <Avatar className="h-28 w-28 ring-4 ring-accent">
            <AvatarImage src={photo} alt={name} className="object-cover" />
            <AvatarFallback className="text-3xl">{name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

        {/* Name & Status */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold">{name} 💕</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            {isOnline ? (
              <Badge className="bg-green-500 text-white text-xs">ONLINE</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">OFFLINE</Badge>
            )}
            <span className="text-muted-foreground text-sm">• {age} yrs</span>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="flex flex-col items-center p-3 rounded-xl border border-border">
            <MapPin className="h-5 w-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">{location || 'Unknown'}</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl border border-border">
            <Briefcase className="h-5 w-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">Dating</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl border border-border">
            <Heart className="h-5 w-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">Matched</span>
          </div>
        </div>

        {/* About */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            About
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {bio || 'No bio yet.'}
          </p>
        </div>

        {/* Interests */}
        {interests.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Interests
            </h4>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Photos
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {photos.slice(0, 3).map((photoUrl, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-xl overflow-hidden bg-accent"
                >
                  <img
                    src={photoUrl}
                    alt={`${name}'s photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {photos.length > 3 && (
                <div className="aspect-square rounded-xl bg-accent flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">
                    +{photos.length - 3} more
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full border-border">
            View Full Profile
          </Button>
          <Button variant="ghost" className="w-full text-destructive hover:text-destructive">
            Block & Report
          </Button>
        </div>
      </div>
    </aside>
  );
}
