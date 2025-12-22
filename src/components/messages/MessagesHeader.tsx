import { Bell, Compass, Sparkles, Heart, MessageSquare, Home, MapPin } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import logoImage from '@/assets/logo.png';
import datingLogoImage from '@/assets/dating-logo.png';

interface MessagesHeaderProps {
  userName: string;
  userPhoto?: string;
  notificationCount?: number;
  accountMode?: 'dating' | 'fishing' | 'both';
}

// Dating-specific nav items
const datingNavLinks = [
  { to: '/app/discover', label: 'Discover', icon: Compass },
  { to: '/app/likes', label: 'Who Likes You', icon: Sparkles },
  { to: '/app/matches', label: 'Matches', icon: Heart },
  { to: '/app/messages', label: 'Messages', icon: MessageSquare },
];

// Fishing/Both mode nav items  
const fishingNavLinks = [
  { to: '/app/discover', label: 'Home', icon: Home },
  { to: '/app/matches', label: 'Matches', icon: Heart },
  { to: '/app/spots', label: 'Fishing Map', icon: MapPin },
  { to: '/app/messages', label: 'Messages', icon: MessageSquare },
];

export function MessagesHeader({ userName, userPhoto, notificationCount = 0, accountMode = 'dating' }: MessagesHeaderProps) {
  const initials = userName?.charAt(0)?.toUpperCase() || 'U';
  const isDatingMode = accountMode === 'dating';
  const navLinks = isDatingMode ? datingNavLinks : fishingNavLinks;

  return (
    <header className="border-b border-border bg-background">
      {/* Main header row */}
      <div className="h-16 px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/app/discover" className="flex items-center gap-2">
          {isDatingMode ? (
            <img src={datingLogoImage} alt="Find Fishing Dates" className="h-8 w-auto" />
          ) : (
            <>
              <img src={logoImage} alt="Find Fishing Dates" className="h-8 w-8 rounded-lg" />
              <span className="font-bold text-lg">Find Fishing Dates</span>
            </>
          )}
        </Link>

        {/* Navigation - Desktop only */}
        <nav className="hidden xl:flex items-center gap-8 ml-auto pr-12">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </Button>
          <Link to="/app/profile">
            <Avatar className="h-10 w-10 ring-2 ring-border">
              <AvatarImage src={userPhoto} alt={userName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>

      {/* Navigation row - Tablet/Mobile only */}
      <nav className="hidden md:flex xl:hidden h-12 px-4 items-center justify-center gap-6 border-t border-border">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 text-sm font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
