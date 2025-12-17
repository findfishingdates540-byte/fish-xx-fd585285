import { Bell } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import logoImage from '@/assets/logo.jpg';

interface MessagesHeaderProps {
  userName: string;
  userPhoto?: string;
  notificationCount?: number;
}

const navLinks = [
  { to: '/app/matches', label: 'Matches' },
  { to: '/app/spots', label: 'Fishing Spots' },
  { to: '/app/messages', label: 'Messages' },
];

export function MessagesHeader({ userName, userPhoto, notificationCount = 0 }: MessagesHeaderProps) {
  const initials = userName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
      {/* Logo */}
      <Link to="/app/discover" className="flex items-center gap-2">
        <img src={logoImage} alt="Find Fishing Dates" className="h-8 w-8 rounded-lg" />
        <span className="font-bold text-lg">Find Fishing Dates</span>
      </Link>

      {/* Navigation */}
      <nav className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'text-sm font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
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
    </header>
  );
}
