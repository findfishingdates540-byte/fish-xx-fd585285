import { useNavigate } from 'react-router-dom';
import { PenSquare, BookImage } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FishXIcon, type FishXIconName } from '@/components/ui/fishx-icon';

interface CreateActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountMode: 'dating' | 'fishing';
}

type Action = {
  key: string;
  to: string;
  lucideIcon?: typeof PenSquare;
  fishxIcon?: FishXIconName;
  label: string;
  description: string;
  modes: string[];
};

const allActions: Action[] = [
  { key: 'post', to: '/app/feed', lucideIcon: PenSquare, label: 'Create Post', description: 'Share an update with your feed', modes: ['fishing', 'both'] },
  { key: 'story', to: '/app/feed', lucideIcon: BookImage, label: 'Add Story', description: 'Share a moment that disappears in 24h', modes: ['fishing', 'both'] },
  { key: 'catch', to: '/app/catches', fishxIcon: 'catchlog', label: 'Log a Catch', description: 'Record your latest catch', modes: ['fishing', 'both'] },
  { key: 'trip', to: '/app/trips/', fishxIcon: 'events', label: 'Plan a Trip', description: 'Organize your next fishing trip', modes: ['fishing', 'both'] },
  { key: 'photo-challenge', to: '/app/photo-challenges', fishxIcon: 'photo', label: 'Enter Photo Challenge', description: 'Submit a photo to an active challenge', modes: ['fishing', 'both'] },
];

export function CreateActionSheet({ open, onOpenChange, accountMode }: CreateActionSheetProps) {
  const navigate = useNavigate();

  const actions = allActions.filter(a => a.modes.includes(accountMode));

  const handleAction = (action: typeof allActions[0]) => {
    onOpenChange(false);
    // For post/story, we navigate and could trigger dialogs via state
    if (action.key === 'story') {
      navigate(action.to, { state: { openStory: true } });
    } else if (action.key === 'post') {
      navigate(action.to, { state: { openPost: true } });
    } else {
      navigate(action.to);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-2">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-center">Create</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-3 gap-3">
          {actions.map((action) => (
            <button
              key={action.key}
              onClick={() => handleAction(action)}
              className="flex flex-col items-center gap-2 rounded-xl p-3 transition-colors hover:bg-accent"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                {action.fishxIcon ? (
                  <FishXIcon name={action.fishxIcon} size={40} />
                ) : action.lucideIcon ? (
                  <action.lucideIcon className="h-5 w-5 text-primary" />
                ) : null}
              </div>
              <span className="text-xs font-medium text-foreground text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
