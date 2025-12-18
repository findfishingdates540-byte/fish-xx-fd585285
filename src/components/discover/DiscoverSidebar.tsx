import { Home, Heart, MapPin, MessageSquare, Settings, Compass, Sparkles, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import logoImage from '@/assets/logo.png';
import datingLogoImage from '@/assets/dating-logo.png';

type AccountMode = 'dating' | 'fishing' | 'both';
type DiscoveryMode = 'fishing' | 'dating' | 'combo';

interface DiscoverSidebarProps {
  accountMode: AccountMode;
  discoveryMode: DiscoveryMode;
  onDiscoveryModeChange: (mode: DiscoveryMode) => void;
  userName: string;
  userPhoto?: string;
  isPremium?: boolean;
}

// Dating-specific nav items
const datingNavItems = [
  { to: '/app/discover', icon: Compass, label: 'Discover' },
  { to: '/app/likes', icon: Sparkles, label: 'Who Likes You' },
  { to: '/app/matches', icon: Heart, label: 'Matches' },
  { to: '/app/messages', icon: MessageSquare, label: 'Messages' },
];

// Fishing/Both mode nav items
const fishingNavItems = [
  { to: '/app/discover', icon: Home, label: 'Home' },
  { to: '/app/matches', icon: Heart, label: 'Matches' },
  { to: '/app/spots', icon: MapPin, label: 'Fishing Map' },
  { to: '/app/messages', icon: MessageSquare, label: 'Messages' },
];

export function DiscoverSidebar({
  accountMode,
  discoveryMode,
  onDiscoveryModeChange,
  userName,
  userPhoto,
  isPremium,
}: DiscoverSidebarProps) {
  const getModeLabel = () => {
    switch (discoveryMode) {
      case 'dating':
        return 'DATING MODE';
      case 'fishing':
        return 'FISHING MODE';
      case 'combo':
        return 'COMBO MODE';
    }
  };

  const initials = userName?.charAt(0)?.toUpperCase() || 'U';
  const isDatingMode = accountMode === 'dating';
  const navItems = isDatingMode ? datingNavItems : fishingNavItems;

  return (
    <aside 
      className={cn(
        "hidden lg:flex flex-col w-60 h-screen border-r p-6 fixed top-0 left-0 z-40",
        isDatingMode 
          ? "bg-gradient-to-b from-dating-light to-background border-dating/20" 
          : "bg-background border-border"
      )}
    >
      {/* Logo */}
      <div className="mb-8">
        {isDatingMode ? (
          <img src={datingLogoImage} alt="Find Fishing Dates" className="h-12 w-auto" />
        ) : (
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="Find Fishing Dates" className="h-8 w-8 rounded-lg" />
            <span className="font-bold text-lg">Find Fishing Dates</span>
          </div>
        )}
        <p className={cn(
          "text-xs mt-1",
          isDatingMode ? "text-dating font-medium" : "text-muted-foreground"
        )}>
          {getModeLabel()}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium',
                isDatingMode
                  ? isActive
                    ? 'bg-dating text-white shadow-md'
                    : 'text-foreground/70 hover:bg-dating/10 hover:text-dating'
                  : isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}

        {/* Discovery Mode Section */}
        {accountMode === 'both' && (
          <div className="pt-6">
            <p className="text-xs font-semibold text-muted-foreground px-4 mb-3">DISCOVERY</p>
            <div className="flex flex-wrap gap-2 px-2">
              {(['fishing', 'dating', 'combo'] as DiscoveryMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onDiscoveryModeChange(mode)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize',
                    discoveryMode === mode
                      ? 'bg-foreground text-background'
                      : 'border border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="flex items-center gap-3 pt-6 border-t border-border">
        <NavLink to="/app/profile" className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userPhoto} alt={userName} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{userName}</p>
            <p className="text-xs text-muted-foreground">
              {isPremium ? 'Pro Member' : 'Free Member'}
            </p>
          </div>
        </NavLink>
        <NavLink to="/app/settings" className="text-muted-foreground hover:text-foreground">
          <Settings className="h-5 w-5" />
        </NavLink>
      </div>
    </aside>
  );
}
