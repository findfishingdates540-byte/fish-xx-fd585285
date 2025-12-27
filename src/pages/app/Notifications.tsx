import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Mail, Heart, MapPin, Settings, Check, MoreHorizontal, Calendar, Anchor, Users, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow, isToday, isYesterday, subDays, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  useNotifications, 
  useUnreadNotificationsCount, 
  useMarkNotificationRead, 
  useMarkAllNotificationsRead,
  useClearNotifications,
  type Notification 
} from '@/hooks/use-notifications';

type FilterType = 'all' | 'unread' | 'matches' | 'spots' | 'system';

interface EnrichedNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: any;
  is_read: boolean;
  created_at: string;
  photo?: string;
  senderName?: string;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();

  // Combine all notification sources - now using database notifications directly
  const allNotifications = useMemo(() => {
    const items: EnrichedNotification[] = [];

    // Add database notifications (now includes all types)
    notifications.forEach((n) => {
      items.push({
        ...n,
        data: n.data || {},
      });
    });

    // Sort by date descending
    return items.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [notifications]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case 'unread':
        return allNotifications.filter(n => !n.is_read);
      case 'matches':
        return allNotifications.filter(n => n.type === 'match' || n.type === 'feed_like' || n.type === 'message');
      case 'spots':
        return allNotifications.filter(n => n.type === 'spot_update' || n.type === 'fishing_alert' || n.type === 'buddy_request' || n.type === 'buddy_message' || n.type === 'trip_invite');
      case 'system':
        return allNotifications.filter(n => n.type === 'system' || n.type === 'verification' || n.type === 'feed_comment');
      default:
        return allNotifications;
    }
  }, [allNotifications, activeFilter]);

  // Group notifications by time period
  const groupedNotifications = useMemo(() => {
    const today: EnrichedNotification[] = [];
    const yesterday: EnrichedNotification[] = [];
    const lastWeek: EnrichedNotification[] = [];
    const older: EnrichedNotification[] = [];
    const oneWeekAgo = subDays(new Date(), 7);

    filteredNotifications.forEach(notification => {
      const date = new Date(notification.created_at);
      if (isToday(date)) {
        today.push(notification);
      } else if (isYesterday(date)) {
        yesterday.push(notification);
      } else if (isAfter(date, oneWeekAgo)) {
        lastWeek.push(notification);
      } else {
        older.push(notification);
      }
    });

    return { today, yesterday, lastWeek, older };
  }, [filteredNotifications]);

  const todayUnreadCount = groupedNotifications.today.filter(n => !n.is_read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match':
      case 'feed_like':
        return Heart;
      case 'spot_update':
      case 'fishing_alert':
        return MapPin;
      case 'trip_invite':
        return Calendar;
      case 'buddy_request':
        return Users;
      case 'message':
      case 'buddy_message':
        return MessageCircle;
      case 'feed_comment':
        return MessageCircle;
      default:
        return Settings;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'match':
      case 'feed_like':
        return 'text-red-500';
      case 'spot_update':
      case 'fishing_alert':
        return 'text-primary';
      case 'trip_invite':
        return 'text-green-500';
      case 'buddy_request':
        return 'text-blue-500';
      case 'message':
      case 'buddy_message':
        return 'text-purple-500';
      case 'feed_comment':
        return 'text-orange-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const handleNotificationClick = (notification: EnrichedNotification) => {
    if (!notification.is_read && notification.id && !notification.id.startsWith('match-') && !notification.id.startsWith('trip-')) {
      markAsRead.mutate(notification.id);
    }
  };

  const getNotificationLink = (notification: EnrichedNotification): string => {
    switch (notification.type) {
      case 'match':
        return '/app/matches';
      case 'message':
        return `/app/messages/${notification.data?.match_id}`;
      case 'feed_like':
      case 'feed_comment':
        return '/app/feed';
      case 'spot_update':
      case 'fishing_alert':
        return '/app/spots';
      case 'trip_invite':
        return `/app/trips/${notification.data?.trip_id}`;
      case 'buddy_request':
        return '/app/buddies';
      case 'buddy_message':
        return `/app/buddy-chat/${notification.data?.buddy_id}`;
      default:
        return '/app';
    }
  };

  const filters = [
    { id: 'all' as FilterType, label: 'All Notifications', icon: Bell },
    { id: 'unread' as FilterType, label: 'Unread', icon: Mail },
    { id: 'matches' as FilterType, label: 'Matches', icon: Heart },
    { id: 'spots' as FilterType, label: 'Fishing Spots', icon: MapPin },
    { id: 'system' as FilterType, label: 'System', icon: Settings },
  ];

  const renderNotification = (notification: EnrichedNotification) => {
    const Icon = getNotificationIcon(notification.type);
    const iconColor = getNotificationColor(notification.type);

    return (
      <Link
        key={notification.id}
        to={getNotificationLink(notification)}
        onClick={() => handleNotificationClick(notification)}
        className="block"
      >
        <Card className={cn(
          "p-3 md:p-4 hover:bg-accent/50 transition-colors relative",
          !notification.is_read && "bg-primary/5 border-primary/20"
        )}>
          <div className="flex gap-3 md:gap-4">
            {/* Photo/Avatar */}
            <div className="flex-shrink-0">
              {notification.photo ? (
                <div className="relative">
                  <img 
                    src={notification.photo} 
                    alt="" 
                    className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover"
                  />
                  <div className={cn(
                    "absolute -bottom-1 -right-1 h-5 w-5 md:h-6 md:w-6 rounded-full bg-background flex items-center justify-center border-2 border-background",
                  )}>
                    <Icon className={cn("h-2.5 w-2.5 md:h-3 md:w-3", iconColor)} />
                  </div>
                </div>
              ) : (
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-accent flex items-center justify-center">
                  <Icon className={cn("h-5 w-5 md:h-6 md:w-6", iconColor)} />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm line-clamp-1">{notification.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {notification.body} • {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
              
              {/* Action buttons - hidden on mobile for space */}
              <div className="hidden md:flex items-center gap-2 mt-2">
                <Icon className={cn("h-4 w-4", iconColor)} />
                {notification.type === 'match' && (
                  <>
                    <Button size="sm" className="h-7 text-xs">Reply</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs">View Profile</Button>
                  </>
                )}
                {notification.type === 'spot_update' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs">Check Map</Button>
                )}
                {notification.type === 'trip_invite' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs">View Details</Button>
                )}
              </div>
            </div>

            {/* Unread indicator & menu */}
            <div className="flex items-start gap-1 md:gap-2">
              {!notification.is_read && (
                <div className="h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-primary mt-1.5" />
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  const renderNotificationGroup = (title: string, notifications: EnrichedNotification[], badge?: number) => {
    if (notifications.length === 0) return null;

    return (
      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-2 mb-2 md:mb-3">
          <h3 className="font-semibold text-base md:text-lg">{title}</h3>
          {badge !== undefined && badge > 0 && (
            <Badge className="bg-primary text-primary-foreground text-xs">
              {badge} New
            </Badge>
          )}
        </div>
        <div className="space-y-2 md:space-y-3">
          {notifications.map(renderNotification)}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl px-4 py-4 md:py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <div className="w-64 flex-shrink-0 hidden md:block">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Filters</h2>
                {unreadCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-xs">
                    {unreadCount} New
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                      activeFilter === filter.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-accent text-muted-foreground"
                    )}
                  >
                    <filter.icon className="h-4 w-4" />
                    {filter.label}
                  </button>
                ))}
              </div>

              <Separator className="my-4" />

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-4 md:mb-6">
              <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (window.history.length > 1) {
                      navigate(-1);
                    } else {
                      navigate('/app');
                    }
                  }}
                  className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <h1 className="text-xl md:text-3xl font-bold truncate">Notifications</h1>
              </div>
              <p className="text-sm md:text-base text-muted-foreground mt-1 ml-10 md:ml-12">
                Stay updated with your latest matches and fishing spots
              </p>
            </div>

            {/* Mobile Filters */}
            <div className="flex gap-2 overflow-x-auto pb-4 md:hidden no-scrollbar -mx-4 px-4">
              {filters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={activeFilter === filter.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter.id)}
                  className="flex-shrink-0"
                >
                  <filter.icon className="h-4 w-4 mr-1" />
                  {filter.label}
                </Button>
              ))}
            </div>

            {/* Mobile Mark All Read Button */}
            <div className="md:hidden mb-4">
              <Button 
                variant="outline" 
                size="sm"
                className="w-full"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            </div>

            {/* Notifications List */}
            {isLoading ? (
              <div className="space-y-3 md:space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-3 md:p-4 animate-pulse">
                    <div className="flex gap-3 md:gap-4">
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-muted flex-shrink-0" />
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="h-4 w-3/4 bg-muted rounded" />
                        <div className="h-3 w-1/2 bg-muted rounded" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12 md:py-16">
                <Anchor className="h-12 w-12 md:h-16 md:w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-sm md:text-base">You're all caught up!</p>
              </div>
            ) : (
              <>
                {renderNotificationGroup('Today', groupedNotifications.today, todayUnreadCount)}
                {renderNotificationGroup('Yesterday', groupedNotifications.yesterday)}
                {renderNotificationGroup('Last Week', groupedNotifications.lastWeek)}
                {renderNotificationGroup('Older', groupedNotifications.older)}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
