import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useNativelyPush() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');

  // Check if running in Natively app
  const isNativeApp = typeof window !== 'undefined' && window.natively?.isNativeApp === true;
  const isIOS = typeof window !== 'undefined' && window.natively?.isIOSApp === true;
  const isAndroid = typeof window !== 'undefined' && window.natively?.isAndroidApp === true;

  useEffect(() => {
    if (!isNativeApp) {
      setIsSupported(false);
      setIsLoading(false);
      return;
    }

    setIsSupported(true);
    checkSubscription();
  }, [isNativeApp]);

  const checkSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const deviceType = isIOS ? 'ios' : 'android';
      const { data: subscription } = await supabase
        .from('push_subscriptions')
        .select('id, fcm_token')
        .eq('user_id', user.id)
        .eq('device_type', deviceType)
        .maybeSingle();

      setIsSubscribed(!!subscription?.fcm_token);
      if (subscription?.fcm_token) {
        setPermission('granted');
      }
    } catch (error) {
      console.error('Error checking Natively subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = useCallback(async () => {
    if (!isNativeApp || !window.NativelyFirebaseNotifications) {
      toast.error('Native push notifications not available');
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

      const notifications = new window.NativelyFirebaseNotifications();

      // Request permission
      const permissionResult = await new Promise<{ status: string }>((resolve) => {
        notifications.firebase_request_permission((result) => {
          resolve(result);
        });
      });

      console.log('Natively permission result:', permissionResult);

      if (permissionResult.status !== 'authorized' && permissionResult.status !== 'granted') {
        setPermission('denied');
        toast.error('Notification permission denied');
        setIsLoading(false);
        return;
      }

      setPermission('granted');

      // Get FCM token
      const fcmResult = await new Promise<{ token: string }>((resolve) => {
        notifications.firebase_get_token((result) => {
          resolve(result);
        });
      });

      console.log('FCM token received:', fcmResult.token ? 'Yes' : 'No');

      if (!fcmResult.token) {
        throw new Error('Failed to get FCM token');
      }

      // For iOS, also get APNS token
      let apnsToken: string | null = null;
      if (isIOS) {
        const apnsResult = await new Promise<{ token: string }>((resolve) => {
          notifications.firebase_get_apns_token((result) => {
            resolve(result);
          });
        });
        apnsToken = apnsResult.token || null;
        console.log('APNS token received:', apnsToken ? 'Yes' : 'No');
      }

      const deviceType = isIOS ? 'ios' : 'android';

      // Check for existing subscription
      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('fcm_token', fcmResult.token)
        .maybeSingle();

      if (existing) {
        console.log('Subscription already exists');
        setIsSubscribed(true);
        toast.success('Notifications already enabled');
        setIsLoading(false);
        return;
      }

      // Delete any old subscriptions for this device type
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('device_type', deviceType);

      // Insert new subscription
      const { error: insertError } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          device_type: deviceType,
          fcm_token: fcmResult.token,
          apns_token: apnsToken,
        });

      if (insertError) {
        throw insertError;
      }

      setIsSubscribed(true);
      toast.success('Notifications enabled!');
      console.log('Natively push subscription saved successfully');
    } catch (error) {
      console.error('Error subscribing to Natively push:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setIsLoading(false);
    }
  }, [isNativeApp, isIOS]);

  const unsubscribe = useCallback(async () => {
    if (!isNativeApp) return;

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const deviceType = isIOS ? 'ios' : 'android';

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('device_type', deviceType);

      if (error) throw error;

      setIsSubscribed(false);
      toast.success('Notifications disabled');
    } catch (error) {
      console.error('Error unsubscribing from Natively push:', error);
      toast.error('Failed to disable notifications');
    } finally {
      setIsLoading(false);
    }
  }, [isNativeApp, isIOS]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    isNativeApp,
  };
}
