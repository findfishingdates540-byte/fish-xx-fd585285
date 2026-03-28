import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Anchor, LayoutDashboard, ChevronDown, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useActiveMode, ActiveMode } from '@/contexts/ActiveModeContext';
import { cn } from '@/lib/utils';

interface AccountSwitcherSheetProps {
  avatarUrl: string;
  displayName: string;
}

const modeOptions: { value: ActiveMode; icon: React.ElementType; label: string; description: string; color: string }[] = [
  { value: 'unified', icon: LayoutDashboard, label: 'Combo Mode', description: 'Access both dating & fishing features', color: 'bg-primary text-primary-foreground' },
  { value: 'dating', icon: Heart, label: 'Dating Mode', description: 'Focus on matches and connections', color: 'bg-pink-500 text-white' },
  { value: 'fishing', icon: Anchor, label: 'Fishing Mode', description: 'Focus on spots, catches & buddies', color: 'bg-blue-500 text-white' },
];

export function AccountSwitcherSheet({ avatarUrl, displayName }: AccountSwitcherSheetProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { activeMode, setActiveMode, isComboUser, isPremium, premiumExpiresAt } = useActiveMode();

  const isPremiumExpired = premiumExpiresAt
    ? new Date(premiumExpiresAt).getTime() < Date.now()
    : false;

  if (!isComboUser || !isPremium || isPremiumExpired) return null;

  const handleSwitch = (mode: ActiveMode) => {
    setActiveMode(mode);
    setOpen(false);
    switch (mode) {
      case 'dating':
        navigate('/app/discover');
        break;
      case 'fishing':
        navigate('/app/feed');
        break;
      case 'unified':
      default:
        navigate('/app/feed');
        break;
    }
  };

  const initials = displayName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Avatar links to profile */}
        <Link to="/app/profile" className="rounded-full focus:outline-none">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={avatarUrl} alt={displayName || 'Profile'} />
            <AvatarFallback className="bg-muted text-muted-foreground text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
        {/* Chevron opens mode switcher */}
        <button
          onClick={() => setOpen(true)}
          className="h-5 w-5 rounded-full bg-muted flex items-center justify-center -ml-1.5 border-2 border-background focus:outline-none"
          aria-label="Switch mode"
        >
          <ChevronDown className="h-3 w-3 text-foreground" />
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-2">
          <SheetHeader className="pb-3">
            <SheetTitle className="text-center">Switch Mode</SheetTitle>
          </SheetHeader>

          <div className="space-y-2">
            {modeOptions.map((mode) => {
              const isActive = activeMode === mode.value;
              return (
                <button
                  key={mode.value}
                  onClick={() => handleSwitch(mode.value)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl p-4 text-left transition-all",
                    isActive
                      ? "bg-accent ring-2 ring-primary"
                      : "bg-muted/50 hover:bg-accent"
                  )}
                >
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", mode.color)}>
                    <mode.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{mode.label}</p>
                    <p className="text-xs text-muted-foreground">{mode.description}</p>
                  </div>
                  {isActive && (
                    <Check className="h-5 w-5 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
