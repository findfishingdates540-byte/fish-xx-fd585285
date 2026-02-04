import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface OnlineBuddy {
  buddyId: string;
  displayName: string;
  photo: string;
}

interface OnlineBuddiesRowProps {
  buddies: OnlineBuddy[];
  onSelect: (buddyId: string) => void;
  currentUser?: {
    name: string;
    photo: string;
  };
}

export function OnlineBuddiesRow({ buddies, onSelect, currentUser }: OnlineBuddiesRowProps) {
  return (
    <div className="border-b border-border">
      <ScrollArea className="w-full">
        <div className="flex gap-4 px-4 py-3">
          {/* Current user - always first and always visible */}
          {currentUser && (
            <div className="flex flex-col items-center gap-1 min-w-0 flex-shrink-0">
              <div className="relative">
                <div className="rounded-full p-[2px] bg-gradient-to-tr from-green-400 to-green-500">
                  <Avatar className="h-14 w-14 border-2 border-background">
                    <AvatarImage src={currentUser.photo} className="object-cover" />
                    <AvatarFallback className="text-sm font-medium">
                      {currentUser.name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {/* Online indicator for current user */}
                <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
              </div>
              <span className="text-xs text-muted-foreground max-w-[56px] truncate">
                Your note
              </span>
            </div>
          )}

          {/* Online buddies */}
          {buddies.map((buddy) => (
            <button
              key={buddy.buddyId}
              onClick={() => onSelect(buddy.buddyId)}
              className="flex flex-col items-center gap-1 min-w-0 flex-shrink-0"
            >
              <div className="relative">
                <div className="rounded-full p-[2px] bg-gradient-to-tr from-green-400 to-green-500">
                  <Avatar className="h-14 w-14 border-2 border-background">
                    <AvatarImage src={buddy.photo} className="object-cover" />
                    <AvatarFallback className="text-sm font-medium">
                      {buddy.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
              </div>
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
