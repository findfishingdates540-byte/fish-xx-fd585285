import { Home, Heart, MessageCircle, User, Fish, MapPin } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

type AccountMode = 'dating' | 'fishing' | 'both';

interface BottomNavProps {
  accountMode: AccountMode;
}

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const getNavItems = (mode: AccountMode): NavItem[] => {
  const baseItems: NavItem[] = [];

  if (mode === 'dating') {
    return [
      { to: '/app/discover', icon: Home, label: 'Discover' },
      { to: '/app/likes', icon: Heart, label: 'Likes' },
      { to: '/app/messages', icon: MessageCircle, label: 'Messages' },
      { to: '/app/profile', icon: User, label: 'Profile' },
    ];
  }

  if (mode === 'fishing') {
    return [
      { to: '/app/spots', icon: MapPin, label: 'Spots' },
      { to: '/app/catches', icon: Fish, label: 'Catches' },
      { to: '/app/buddies', icon: Heart, label: 'Buddies' },
      { to: '/app/profile', icon: User, label: 'Profile' },
    ];
  }

  // Both mode - combined navigation
  return [
    { to: '/app/discover', icon: Home, label: 'Discover' },
    { to: '/app/spots', icon: MapPin, label: 'Spots' },
    { to: '/app/messages', icon: MessageCircle, label: 'Messages' },
    { to: '/app/profile', icon: User, label: 'Profile' },
  ];
};

export function BottomNav({ accountMode }: BottomNavProps) {
  const navItems = getNavItems(accountMode);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn('h-5 w-5', isActive && 'fill-current')}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-xs font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
