import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useCapacitorPush() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [debugInfo, setDebugInfo] = useState<string>('');

  const isNativePlatform = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

  useEffect(() => {
    const info = { isNativePlatform, platform };
    console.log('[Capacitor Push] Detection info:', info);
    setDebugInfo(JSON.stringify(info));

    if (!isNativePlatform) {
      setIsSupported(false);
      setIsLoading(false);
      return;
    }

    setIsSupported(true);
    checkSubscription();
  }, [isNativePlatform]);

  const checkSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const deviceType = platform === 'ios' ? 'ios' : 'android';
      const { data: subscription } = await supabase
        .from('push_subscriptions')
        .select('id, fcm_token')
        .eq('user_id', user.id)
        .eq('device_type', deviceType)
        .maybeSingle();

      setIsSubscribed(!!subscription?.fcm_token);
      if (subscription?.fcm_token) setPermission('granted');
    } catch (error) {
      console.error('[Capacitor Push] Error checking subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = useCallback(async () => {
    if (!isNativePlatform) {
      toast.error('Push notifications require a native app');
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to enable notifications');
        setIsLoading(false);
        return;
      }

      // Request permission
      const permResult = await PushNotifications.requestPermissions();
      if (permResult.receive !== 'granted') {
        setPermission('denied');
        toast.error('Notification permission denied');
        setIsLoading(false);
        return;
      }

      setPermission('granted');

      // Register to get token
      await PushNotifications.register();

      // Listen for registration token
      const tokenPromise = new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Token registration timed out')), 30000);

        PushNotifications.addListener('registration', (token) => {
          clearTimeout(timeout);
          resolve(token.value);
        });

        PushNotifications.addListener('registrationError', (err) => {
          clearTimeout(timeout);
          reject(new Error(err.error));
        });
      });

      const fcmToken = await tokenPromise;
      if (!fcmToken) throw new Error('Empty FCM token received');

      const deviceType = platform === 'ios' ? 'ios' : 'android';

      // Check existing
      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('fcm_token', fcmToken)
        .maybeSingle();

      if (existing) {
        setIsSubscribed(true);
        toast.success('Notifications already enabled');
        setIsLoading(false);
        return;
      }

      // Delete old subscriptions for this device type
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('device_type', deviceType);

      // Insert new
      const { error: insertError } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          device_type: deviceType,
          fcm_token: fcmToken,
        });

      if (insertError) throw insertError;

      setIsSubscribed(true);
      toast.success('Notifications enabled!');
    } catch (error) {
      console.error('[Capacitor Push] Error subscribing:', error);
      toast.error(`Failed to enable notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [isNativePlatform, platform]);

  const unsubscribe = useCallback(async () => {
    if (!isNativePlatform) return;
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      const deviceType = platform === 'ios' ? 'ios' : 'android';
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('device_type', deviceType);

      if (error) throw error;

      setIsSubscribed(false);
      toast.success('Notifications disabled');
    } catch (error) {
      console.error('[Capacitor Push] Error unsubscribing:', error);
      toast.error('Failed to disable notifications');
    } finally {
      setIsLoading(false);
    }
  }, [isNativePlatform, platform]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    isNativePlatform,
    platform,
    debugInfo,
  };
}
