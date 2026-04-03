import { useNavigate } from 'react-router-dom';
import { Fish, Heart, ChevronRight, Plus, Check } from 'lucide-react';
import { useActiveMode } from '@/contexts/ActiveModeContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface AccountSwitcherSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayName: string;
  avatarUrl: string;
  accountMode: string | null;
  onCreateDating: () => void;
}

export function AccountSwitcherSheet({
  open,
  onOpenChange,
  displayName,
  avatarUrl,
  accountMode,
  onCreateDating,
}: AccountSwitcherSheetProps) {
  const navigate = useNavigate();
  const { activeMode, setActiveMode } = useActiveMode();
  const initials = displayName?.charAt(0)?.toUpperCase() || 'U';

  const hasFishing = accountMode === 'fishing' || accountMode === 'both';
  const hasDating = accountMode === 'dating' || accountMode === 'both';

  const currentIsFishing = activeMode === 'fishing' || activeMode === 'unified';
  const currentIsDating = activeMode === 'dating';

  const handleSwitch = (mode: 'fishing' | 'dating') => {
    setActiveMode(mode);
    onOpenChange(false);
    navigate(mode === 'dating' ? '/app/discover' : '/app/feed');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 pt-2">
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-4">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="text-left pb-3">
          <SheetTitle className="text-lg">Switch Account</SheetTitle>
          <SheetDescription className="sr-only">Choose which profile to use</SheetDescription>
        </SheetHeader>

        <div className="space-y-1">
          {/* Fishing Account Row */}
          {hasFishing && (
            <button
              onClick={() => handleSwitch('fishing')}
              className="flex w-full items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-muted"
            >
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-blue-200">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-blue-50 text-blue-600">{initials}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-blue-500 p-1">
                  <Fish className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">Fishing Profile</p>
              </div>
              {currentIsFishing && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
            </button>
          )}

          {/* Dating Account Row */}
          {hasDating && (
            <button
              onClick={() => handleSwitch('dating')}
              className="flex w-full items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-muted"
            >
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-pink-200">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-pink-50 text-pink-600">{initials}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-pink-500 p-1">
                  <Heart className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">Dating Profile</p>
              </div>
              {currentIsDating && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
            </button>
          )}

          {/* Create Dating Profile */}
          {!hasDating && (
            <>
              <Separator className="my-2" />
              <button
                onClick={() => {
                  onOpenChange(false);
                  onCreateDating();
                }}
                className="flex w-full items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-muted"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-pink-300 bg-pink-50 dark:bg-pink-950/30">
                  <Plus className="h-5 w-5 text-pink-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground">Create Dating Profile</p>
                  <p className="text-xs text-muted-foreground">Find your fishing partner</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
