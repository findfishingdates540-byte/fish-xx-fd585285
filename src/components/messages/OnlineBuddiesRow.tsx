import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface OnlineBuddy {
  buddyId: string;
  displayName: string;
  photo: string;
}

interface OnlineBuddiesRowProps {
  buddies: OnlineBuddy[];
  onSelect: (buddyId: string) => void;
}

export function OnlineBuddiesRow({ buddies, onSelect }: OnlineBuddiesRowProps) {
  if (buddies.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-border">
      <ScrollArea className="w-full">
        <div className="flex gap-4 px-4 py-3">
          {buddies.map((buddy) => (
            <button
              key={buddy.buddyId}
              onClick={() => onSelect(buddy.buddyId)}
              className="flex flex-col items-center gap-1 min-w-0 flex-shrink-0"
            >
              {/* Avatar with green online ring */}
              <div className="relative">
                <div className="rounded-full p-[2px] bg-gradient-to-tr from-primary to-primary/80">
                  <Avatar className="h-14 w-14 border-2 border-background">
                    <AvatarImage src={buddy.photo} className="object-cover" />
                    <AvatarFallback className="text-sm font-medium">
                      {buddy.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {/* Small green dot indicator */}
                <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-primary border-2 border-background" />
              </div>
              {/* Name */}
              <span className="text-xs text-muted-foreground max-w-[56px] truncate">
                {buddy.displayName}
              </span>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
}
