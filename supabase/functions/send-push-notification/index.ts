import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

// Cache for OAuth access token
let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

// Base64URL encode
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Create JWT for Google OAuth
async function createJWT(serviceAccount: ServiceAccount): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600, // 1 hour
  };

  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Import the private key
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = serviceAccount.private_key
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  return `${signatureInput}.${encodedSignature}`;
}

// Get OAuth access token for FCM
async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  // Check if we have a valid cached token
  if (cachedAccessToken && Date.now() < tokenExpiry - 60000) {
    return cachedAccessToken;
  }

  const jwt = await createJWT(serviceAccount);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OAuth token error:', errorText);
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000);
  
  return cachedAccessToken!;
}

// Send FCM V1 notification
async function sendFCMNotification(
  accessToken: string,
  projectId: string,
  fcmToken: string,
  title: string,
  body: string,
  url?: string
): Promise<{ success: boolean; error?: string }> {
  const message = {
    message: {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        url: url || '/app/messages',
        click_action: 'OPEN_APP',
      },
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
          click_action: 'OPEN_APP',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    },
  };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('FCM send error:', response.status, errorData);
    
    // Check for invalid token errors
    if (response.status === 404 || 
        response.status === 400 && errorData?.error?.details?.some((d: any) => 
          d.errorCode === 'UNREGISTERED' || d.errorCode === 'INVALID_ARGUMENT'
        )) {
      return { success: false, error: 'INVALID_TOKEN' };
    }
    
    return { success: false, error: errorData?.error?.message || 'Unknown error' };
  }

  return { success: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firebaseServiceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, title, body, icon, url, tag }: PushPayload = await req.json();

    console.log(`Sending push notification to user: ${userId}`);
    console.log(`Title: ${title}, Body: ${body}`);

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found for user');
      return new Response(JSON.stringify({ sent: 0, message: 'No subscriptions found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${subscriptions.length} subscriptions`);

    // Parse Firebase service account if available
    let serviceAccount: ServiceAccount | null = null;
    let fcmAccessToken: string | null = null;
    
    if (firebaseServiceAccountJson) {
      try {
        serviceAccount = JSON.parse(firebaseServiceAccountJson);
        if (serviceAccount) {
          fcmAccessToken = await getAccessToken(serviceAccount);
          console.log('FCM access token obtained successfully');
        }
      } catch (error) {
        console.error('Error parsing Firebase service account or getting token:', error);
      }
    }

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          // Handle native FCM subscriptions (Android/iOS)
          if ((sub.device_type === 'android' || sub.device_type === 'ios') && sub.fcm_token) {
            if (!serviceAccount || !fcmAccessToken) {
              console.error(`No FCM credentials available for ${sub.device_type} device ${sub.id}`);
              return { success: false, id: sub.id, error: 'No FCM credentials' };
            }

            console.log(`Sending FCM notification to ${sub.device_type} device: ${sub.id}`);
            
            const result = await sendFCMNotification(
              fcmAccessToken,
              serviceAccount.project_id,
              sub.fcm_token,
              title,
              body,
              url
            );

            if (!result.success) {
              console.error(`FCM send failed for ${sub.id}: ${result.error}`);
              
              // Remove invalid token
              if (result.error === 'INVALID_TOKEN') {
                await supabase
                  .from('push_subscriptions')
                  .delete()
                  .eq('id', sub.id);
                console.log(`Removed invalid FCM subscription: ${sub.id}`);
              }
              
              return { success: false, id: sub.id, error: result.error };
            }

            console.log(`FCM notification sent successfully to ${sub.id}`);
            return { success: true, id: sub.id };
          }

          // Handle web push subscriptions
          if (sub.device_type === 'web' && sub.endpoint) {
            console.log(`Sending web push to: ${sub.id}`);
            
            const payload = JSON.stringify({
              title,
              body,
              icon: icon || '/favicon.png',
              badge: '/favicon.png',
              url: url || '/app/messages',
              tag: tag || 'message',
            });

            const response = await fetch(sub.endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'TTL': '86400',
              },
              body: payload,
            });

            console.log(`Web push response for ${sub.id}: ${response.status}`);

            if (!response.ok) {
              console.error(`Web push failed for ${sub.id}: ${response.status} ${response.statusText}`);
              // Remove invalid subscription
              if (response.status === 404 || response.status === 410) {
                await supabase
                  .from('push_subscriptions')
                  .delete()
                  .eq('id', sub.id);
                console.log(`Removed invalid web subscription: ${sub.id}`);
              }
              return { success: false, id: sub.id, status: response.status };
            }

            console.log(`Web push sent successfully to ${sub.id}`);
            return { success: true, id: sub.id };
          }

          console.log(`Skipping subscription ${sub.id} - unknown type or missing credentials`);
          return { success: false, id: sub.id, error: 'Unknown subscription type' };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error sending push to ${sub.id}:`, errorMessage);
          return { success: false, id: sub.id, error: errorMessage };
        }
      })
    );

    const sent = results.filter((r) => r.success).length;
    console.log(`Successfully sent ${sent}/${subscriptions.length} notifications`);

    return new Response(JSON.stringify({ sent, total: subscriptions.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-push-notification:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
