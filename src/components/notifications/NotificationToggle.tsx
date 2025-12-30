import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotificationsUnified } from '@/hooks/use-push-notifications-unified';

export function NotificationToggle() {
  const { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe } = usePushNotificationsUnified();

  if (!isSupported) {
    return null;
  }

  const handleToggle = () => {
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full justify-start"
      onClick={handleToggle}
      disabled={isLoading || permission === 'denied'}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-3 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="h-4 w-4 mr-3" />
      ) : (
        <BellOff className="h-4 w-4 mr-3" />
      )}
      {isSubscribed ? 'Notifications Enabled' : 'Enable Notifications'}
      {permission === 'denied' && (
        <span className="text-xs text-muted-foreground ml-2">(blocked)</span>
      )}
    </Button>
  );
}
