import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Fetch VAPID public key
  useEffect(() => {
    const fetchVapidKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-vapid-key');
        if (error) throw error;
        if (data?.publicKey) {
          setVapidKey(data.publicKey);
        }
      } catch (error) {
        console.error('Error fetching VAPID key:', error);
      }
    };

    if (isSupported) {
      fetchVapidKey();
    }
  }, [isSupported]);

  // Register service worker and check subscription status
  useEffect(() => {
    if (!isSupported || !user?.id) return;

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    checkSubscription();
  }, [isSupported, user?.id]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !user?.id || !vapidKey) {
      toast({
        title: 'Not available',
        description: 'Push notifications are not configured yet',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        toast({
          title: 'Permission denied',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive',
        });
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const subscriptionJson = subscription.toJSON();

      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionJson.endpoint!,
          p256dh: subscriptionJson.keys!.p256dh,
          auth: subscriptionJson.keys!.auth,
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: 'Notifications enabled',
        description: "You'll receive alerts for new matches and messages",
      });

      return true;
    } catch (error: any) {
      console.error('Error subscribing to push:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to enable notifications',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user?.id, vapidKey, toast]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported || !user?.id) return false;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);
      }

      setIsSubscribed(false);
      toast({
        title: 'Notifications disabled',
        description: "You won't receive push notifications anymore",
      });

      return true;
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to disable notifications',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user?.id, toast]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    vapidKeyLoaded: !!vapidKey,
    subscribe,
    unsubscribe,
  };
}
