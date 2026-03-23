import { usePushNotifications } from './use-push-notifications';
import { useCapacitorPush } from './use-capacitor-push';

/**
 * Unified push notifications hook that automatically detects the platform
 * and uses the appropriate implementation (Capacitor for native apps,
 * Web Push for browsers).
 */
export function usePushNotificationsUnified() {
  const webPush = usePushNotifications();
  const capacitorPush = useCapacitorPush();

  // If running in Capacitor native app, use native push
  if (capacitorPush.isNativePlatform) {
    return {
      isSupported: capacitorPush.isSupported,
      isSubscribed: capacitorPush.isSubscribed,
      isLoading: capacitorPush.isLoading,
      permission: capacitorPush.permission,
      subscribe: capacitorPush.subscribe,
      unsubscribe: capacitorPush.unsubscribe,
      platform: 'native' as const,
      debugInfo: capacitorPush.debugInfo,
    };
  }

  // Otherwise use web push
  return {
    isSupported: webPush.isSupported,
    isSubscribed: webPush.isSubscribed,
    isLoading: webPush.isLoading,
    permission: webPush.permission,
    subscribe: webPush.subscribe,
    unsubscribe: webPush.unsubscribe,
    platform: 'web' as const,
    debugInfo: '',
  };
}
