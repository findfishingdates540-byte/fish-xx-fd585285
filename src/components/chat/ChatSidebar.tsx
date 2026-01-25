import { useState } from 'react';
import { Heart, MapPin, MessageSquare, ArrowLeft, LayoutDashboard, Anchor, UserPlus, Check } from 'lucide-react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useActiveMode, ActiveMode } from '@/contexts/ActiveModeContext';
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
  accountMode?: 'dating' | 'fishing' | 'both';
}

const navItems = [
  { to: '/app/discover', icon: Heart, label: 'Find a Date' },
  { to: '/app/spots', icon: MapPin, label: 'Spots Map' },
  { to: '/app/messages', icon: MessageSquare, label: 'Messages', showBadge: true },
];

export function ChatSidebar({ conversations, selectedId, onSelect, unreadCount = 0, accountMode = 'dating' }: ChatSidebarProps) {
  const { activeMode, setActiveMode, isComboUser } = useActiveMode();
  const navigate = useNavigate();

  // For combo users, this just switches their view preference (not account type in DB)
  const handleModeSwitch = (mode: 'unified' | 'dating' | 'fishing') => {
    setActiveMode(mode);
    // Navigate to the appropriate home page for the selected mode
    switch (mode) {
      case 'dating':
        navigate('/app/discover');
        break;
      case 'fishing':
        navigate('/app/spots');
        break;
      case 'unified':
      default:
        navigate('/app/dashboard');
        break;
    }
  };
  
  const getModeLabel = () => {
    if (isComboUser) {
      switch (activeMode) {
        case 'dating':
          return 'Dating Mode';
        case 'fishing':
          return 'Fishing Mode';
        case 'unified':
        default:
          return 'Combo Mode';
      }
    }
    return accountMode === 'both' ? 'Combo Mode' : 'Dating Mode';
  };

  // Invite button component
  const InviteButton = () => {
    const [copied, setCopied] = useState(false);
    
    const handleInvite = async () => {
      const PRODUCTION_URL = 'https://findfishingdates.net';
      const inviteUrl = `${PRODUCTION_URL}?ref=invite`;
      
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Join me on Find Fishing Dates!',
            text: 'Find fishing buddies and dates who share your passion.',
            url: inviteUrl,
          });
        } else {
          await navigator.clipboard.writeText(inviteUrl);
          setCopied(true);
          toast.success('Invite link copied!');
          setTimeout(() => setCopied(false), 2000);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(inviteUrl);
          setCopied(true);
          toast.success('Invite link copied!');
          setTimeout(() => setCopied(false), 2000);
        }
      }
    };

    return (
      <button 
        onClick={handleInvite}
        className="text-muted-foreground hover:text-foreground transition-colors"
        title="Invite Friends"
      >
        {copied ? <Check className="h-5 w-5 text-green-500" /> : <UserPlus className="h-5 w-5" />}
      </button>
    );
  };

  return (
    <aside className="hidden md:flex flex-col w-72 h-screen border-r border-border bg-background flex-shrink-0">
      {/* Mode Switcher for Combo Users */}
      {isComboUser && (
        <div className="px-4 pt-4">
          <Button variant="ghost" size="sm" asChild className="gap-2 justify-start -ml-2 mb-2">
            <Link to="/app/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex bg-muted rounded-lg p-1 gap-1">
            {[
              { value: 'unified' as ActiveMode, label: 'All', icon: LayoutDashboard },
              { value: 'dating' as ActiveMode, label: 'Dating', icon: Heart },
              { value: 'fishing' as ActiveMode, label: 'Fishing', icon: Anchor },
            ].map((mode) => (
              <button
                key={mode.value}
                onClick={() => handleModeSwitch(mode.value)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium",
                  activeMode === mode.value
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <mode.icon className="h-3 w-3" />
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Logo */}
      <div className={cn("p-6 border-b border-border", isComboUser && "pt-2")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="Find Fishing Dates" className="h-8 w-8 rounded-lg" />
            <div>
              <span className="font-bold text-lg block">Find Fishing Dates</span>
              <span className="text-xs text-primary">{getModeLabel()}</span>
            </div>
          </div>
          <InviteButton />
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
                'flex items-center justify-between px-4 py-3 rounded-xl font-medium',
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
                'w-full flex items-center gap-3 p-3 rounded-xl text-left',
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
