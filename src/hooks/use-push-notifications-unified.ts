import { usePushNotifications } from './use-push-notifications';
import { useNativelyPush } from './use-natively-push';

/**
 * Unified push notifications hook that automatically detects the platform
 * and uses the appropriate implementation (Natively SDK for native apps,
 * Web Push for browsers).
 */
export function usePushNotificationsUnified() {
  const webPush = usePushNotifications();
  const nativelyPush = useNativelyPush();

  // If running in Natively app, use native push
  if (nativelyPush.isNativeApp) {
    return {
      isSupported: nativelyPush.isSupported,
      isSubscribed: nativelyPush.isSubscribed,
      isLoading: nativelyPush.isLoading,
      permission: nativelyPush.permission,
      subscribe: nativelyPush.subscribe,
      unsubscribe: nativelyPush.unsubscribe,
      platform: 'native' as const,
      debugInfo: nativelyPush.debugInfo,
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
