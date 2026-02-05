import { Bell, BellOff, Loader2, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotificationsUnified } from '@/hooks/use-push-notifications-unified';
import { useState } from 'react';

export function NotificationToggle() {
  const { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe, platform, debugInfo } = usePushNotificationsUnified();
  const [showDebug, setShowDebug] = useState(false);

  const handleToggle = () => {
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  return (
    <div className="space-y-2">
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
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Platform: {platform || 'detecting...'}</span>
        <span>|</span>
        <span>Supported: {isSupported ? 'Yes' : 'No'}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2"
          onClick={() => setShowDebug(!showDebug)}
        >
          <Bug className="h-3 w-3" />
        </Button>
      </div>
      
      {showDebug && debugInfo && (
        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
          {debugInfo}
        </pre>
      )}
    </div>
  );
}
