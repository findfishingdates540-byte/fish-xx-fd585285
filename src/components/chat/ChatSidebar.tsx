import { Heart, MapPin, MessageSquare } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import logoImage from '@/assets/logo.png';

interface Conversation {
  id: string;
  name: string;
  photo: string;
  lastMessage: string;
  time: string;
  isOnline?: boolean;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  unreadCount?: number;
}

const navItems = [
  { to: '/app/discover', icon: Heart, label: 'Find a Date' },
  { to: '/app/spots', icon: MapPin, label: 'Spots Map' },
  { to: '/app/messages', icon: MessageSquare, label: 'Messages', showBadge: true },
];

export function ChatSidebar({ conversations, selectedId, onSelect, unreadCount = 0 }: ChatSidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-72 h-screen border-r border-border bg-background flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <img src={logoImage} alt="Find Fishing Dates" className="h-8 w-8 rounded-lg" />
          <div>
            <span className="font-bold text-lg block">Find Fishing Dates</span>
            <span className="text-xs text-primary">Dating Mode</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between px-4 py-3 rounded-xl transition-colors font-medium',
                isActive
                  ? 'bg-accent text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5" />
              {item.label}
            </div>
            {item.showBadge && unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs h-5 min-w-[20px]">
                {unreadCount}
              </Badge>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-4">
        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 px-2">
          Your Matches
        </p>
        <div className="space-y-1">
          {conversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => onSelect(convo.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors',
                selectedId === convo.id
                  ? 'bg-accent'
                  : 'hover:bg-accent/50'
              )}
            >
              <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={convo.photo} alt={convo.name} />
                  <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {convo.isOnline && (
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{convo.name}</span>
                  <span className="text-xs text-muted-foreground">{convo.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{convo.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
