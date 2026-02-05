import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useNativelyPush() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Check if running in Natively app - more robust detection
  const isNativeApp = typeof window !== 'undefined' && (
    window.natively?.isNativeApp === true ||
    typeof window.NativelyFirebaseNotifications !== 'undefined'
  );
  const isIOS = typeof window !== 'undefined' && window.natively?.isIOSApp === true;
  const isAndroid = typeof window !== 'undefined' && (
    window.natively?.isAndroidApp === true ||
    (isNativeApp && !isIOS)
  );

  useEffect(() => {
    // Debug logging
    const nativelyInfo = {
      hasNatively: typeof window !== 'undefined' && !!window.natively,
      isNativeApp: window.natively?.isNativeApp,
      isIOSApp: window.natively?.isIOSApp,
      isAndroidApp: window.natively?.isAndroidApp,
      hasFirebaseNotifications: typeof window !== 'undefined' && typeof window.NativelyFirebaseNotifications !== 'undefined',
    };
    console.log('[Natively Push] Detection info:', nativelyInfo);
    setDebugInfo(JSON.stringify(nativelyInfo));

    if (!isNativeApp) {
      console.log('[Natively Push] Not running in native app');
      setIsSupported(false);
      setIsLoading(false);
      return;
    }

    console.log('[Natively Push] Running in native app, checking subscription...');
    setIsSupported(true);
    checkSubscription();
  }, [isNativeApp]);

  const checkSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[Natively Push] No user logged in');
        setIsLoading(false);
        return;
      }

      const deviceType = isIOS ? 'ios' : 'android';
      console.log(`[Natively Push] Checking subscription for user ${user.id}, device: ${deviceType}`);
      
      const { data: subscription, error } = await supabase
        .from('push_subscriptions')
        .select('id, fcm_token')
        .eq('user_id', user.id)
        .eq('device_type', deviceType)
        .maybeSingle();

      if (error) {
        console.error('[Natively Push] Error checking subscription:', error);
      }

      console.log('[Natively Push] Subscription found:', !!subscription?.fcm_token);
      setIsSubscribed(!!subscription?.fcm_token);
      if (subscription?.fcm_token) {
        setPermission('granted');
      }
    } catch (error) {
      console.error('[Natively Push] Error checking subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = useCallback(async () => {
    console.log('[Natively Push] Subscribe called');
    console.log('[Natively Push] isNativeApp:', isNativeApp);
    console.log('[Natively Push] NativelyFirebaseNotifications available:', typeof window.NativelyFirebaseNotifications !== 'undefined');

    if (!isNativeApp) {
      console.error('[Natively Push] Not in native app');
      toast.error('Native push notifications not available - not in native app');
      return;
    }

    if (!window.NativelyFirebaseNotifications) {
      console.error('[Natively Push] NativelyFirebaseNotifications not found');
      toast.error('Firebase notifications SDK not loaded. Please update your Natively app.');
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

      console.log('[Natively Push] User ID:', user.id);

      const notifications = new window.NativelyFirebaseNotifications();
      console.log('[Natively Push] NativelyFirebaseNotifications instance created');

      // Request permission with timeout
      console.log('[Natively Push] Requesting permission...');
      const permissionResult = await Promise.race([
        new Promise<{ status: string }>((resolve) => {
          notifications.firebase_request_permission((result) => {
            console.log('[Natively Push] Permission callback received:', result);
            resolve(result);
          });
        }),
        new Promise<{ status: string }>((_, reject) => 
          setTimeout(() => reject(new Error('Permission request timed out')), 30000)
        )
      ]);

      console.log('[Natively Push] Permission result:', permissionResult);

      if (permissionResult.status !== 'authorized' && permissionResult.status !== 'granted') {
        setPermission('denied');
        toast.error(`Notification permission denied: ${permissionResult.status}`);
        setIsLoading(false);
        return;
      }

      setPermission('granted');
      console.log('[Natively Push] Permission granted, getting FCM token...');

      // Get FCM token with timeout
      const fcmResult = await Promise.race([
        new Promise<{ token: string }>((resolve) => {
          notifications.firebase_get_token((result) => {
            console.log('[Natively Push] FCM token callback received:', result?.token ? 'Token received' : 'No token');
            resolve(result);
          });
        }),
        new Promise<{ token: string }>((_, reject) => 
          setTimeout(() => reject(new Error('FCM token request timed out')), 30000)
        )
      ]);

      console.log('[Natively Push] FCM token result:', fcmResult.token ? `Token length: ${fcmResult.token.length}` : 'No token');

      if (!fcmResult.token) {
        throw new Error('Failed to get FCM token - token is empty');
      }

      // For iOS, also get APNS token
      let apnsToken: string | null = null;
      if (isIOS) {
        try {
          const apnsResult = await Promise.race([
            new Promise<{ token: string }>((resolve) => {
              notifications.firebase_get_apns_token((result) => {
                resolve(result);
              });
            }),
            new Promise<{ token: string }>((_, reject) => 
              setTimeout(() => reject(new Error('APNS token request timed out')), 10000)
            )
          ]);
          apnsToken = apnsResult.token || null;
          console.log('[Natively Push] APNS token:', apnsToken ? 'Yes' : 'No');
        } catch (apnsError) {
          console.warn('[Natively Push] APNS token failed (non-critical):', apnsError);
        }
      }

      const deviceType = isIOS ? 'ios' : 'android';
      console.log('[Natively Push] Device type:', deviceType);

      // Check for existing subscription
      const { data: existing, error: checkError } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('fcm_token', fcmResult.token)
        .maybeSingle();

      if (checkError) {
        console.error('[Natively Push] Error checking existing subscription:', checkError);
      }

      if (existing) {
        console.log('[Natively Push] Subscription already exists:', existing.id);
        setIsSubscribed(true);
        toast.success('Notifications already enabled');
        setIsLoading(false);
        return;
      }

      // Delete any old subscriptions for this device type
      console.log('[Natively Push] Deleting old subscriptions...');
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('device_type', deviceType);

      if (deleteError) {
        console.warn('[Natively Push] Delete old subscriptions error:', deleteError);
      }

      // Insert new subscription
      console.log('[Natively Push] Inserting new subscription...');
      const { data: insertData, error: insertError } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          device_type: deviceType,
          fcm_token: fcmResult.token,
          apns_token: apnsToken,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[Natively Push] Insert error:', insertError);
        throw insertError;
      }

      console.log('[Natively Push] Subscription saved successfully:', insertData?.id);
      setIsSubscribed(true);
      toast.success('Notifications enabled!');
    } catch (error) {
      console.error('[Natively Push] Error subscribing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to enable notifications: ${errorMessage}`);
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
    isIOS,
    isAndroid,
    debugInfo,
  };
}
