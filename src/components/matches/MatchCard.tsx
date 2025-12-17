import { MessageSquare, Waves, BadgeCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type OnlineStatus = 'online' | 'gone_fishing' | 'offline';

interface MatchCardProps {
  id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  isVerified?: boolean;
  isNew?: boolean;
  status: OnlineStatus;
  lastSeen?: string;
  onSayHi?: () => void;
  onStartChat?: () => void;
  onWave?: () => void;
}

export function MatchCard({
  name,
  age,
  photo,
  bio,
  isVerified,
  isNew,
  status,
  lastSeen,
  onSayHi,
  onStartChat,
  onWave,
}: MatchCardProps) {
  const isActiveNow = lastSeen === 'Active now';

  const getStatusIndicator = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'gone_fishing':
        return 'bg-blue-500';
      default:
        if (isActiveNow) {
          return 'bg-yellow-500';
        }
        return 'bg-muted-foreground/50';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return <span className="text-green-600 text-xs font-medium">Online Now</span>;
      case 'gone_fishing':
        return (
          <span className="text-blue-600 text-xs font-medium flex items-center gap-1">
            <span>🎣</span> Gone Fishing
          </span>
        );
      default:
        if (isActiveNow) {
          return <span className="text-yellow-600 text-xs font-medium">Active now</span>;
        }
        return <span className="text-muted-foreground text-xs">Last seen {lastSeen}</span>;
    }
  };

  const getActionButton = () => {
    if (status === 'online') {
      return (
        <Button 
          className="w-full bg-foreground text-background hover:bg-foreground/90" 
          onClick={onSayHi}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Say Hi
        </Button>
      );
    }
    if (status === 'gone_fishing') {
      return (
        <Button 
          className="w-full bg-foreground text-background hover:bg-foreground/90" 
          onClick={onStartChat}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Start Chat
        </Button>
      );
    }
    return (
      <Button 
        variant="outline" 
        className="w-full border-foreground text-foreground hover:bg-accent" 
        onClick={onWave}
      >
        <Waves className="h-4 w-4 mr-2" />
        Wave
      </Button>
    );
  };

  return (
    <div className="relative bg-background border border-border rounded-2xl p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
      {isNew && (
        <Badge className="absolute top-3 right-3 bg-foreground text-background text-xs">
          NEW
        </Badge>
      )}

      <div className="relative mb-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={photo} alt={name} className="object-cover" />
          <AvatarFallback className="text-2xl">{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div 
          className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-background ${getStatusIndicator()}`}
        />
      </div>

      <div className="flex items-center gap-1 mb-1">
        <h3 className="font-bold text-lg">{name}, {age}</h3>
        {isVerified && <BadgeCheck className="h-4 w-4 text-blue-500" />}
      </div>

      {getStatusText()}

      <p className="text-sm text-muted-foreground mt-3 mb-4 line-clamp-2 min-h-[2.5rem]">
        {bio}
      </p>

      {getActionButton()}
    </div>
  );
}
