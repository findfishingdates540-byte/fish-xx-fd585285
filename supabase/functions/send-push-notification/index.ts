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

// Base64URL decode
function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Create JWT for Google OAuth (FCM)
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
    exp: now + 3600,
  };

  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = serviceAccount.private_key
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

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
          icon: 'ic_notification', // Default Android notification icon
          color: '#10B981', // Brand color (emerald)
          default_vibrate_timings: true,
          default_light_settings: true,
          visibility: 'PUBLIC' as const,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'mutable-content': 1,
          },
        },
        fcm_options: {
          image: 'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/profile-photos/app-icon.png',
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

// ============= Web Push Implementation =============

// Create VAPID JWT for Web Push
async function createVapidJWT(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  subject: string
): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  
  const audience = new URL(endpoint).origin;
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Decode the VAPID private key (32 bytes raw private key)
  const privateKeyBytes = base64UrlDecode(vapidPrivateKey);
  
  // For ECDSA P-256, we need to import as JWK since raw import isn't directly supported for private keys
  // Convert raw 32-byte private key to JWK format
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);
  
  // The public key is 65 bytes (0x04 + 32 byte X + 32 byte Y)
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);
  
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: base64UrlEncode(x),
    y: base64UrlEncode(y),
    d: base64UrlEncode(privateKeyBytes),
  };

  const privateKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign the JWT
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  // ECDSA signature from WebCrypto is in IEEE P1363 format (r || s), which is what we need
  const signature = new Uint8Array(signatureBuffer);
  const encodedSignature = base64UrlEncode(signature);

  return `${unsignedToken}.${encodedSignature}`;
}

// Generate ECDH key pair for encryption
async function generateECDHKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
}

// Export public key to uncompressed format
async function exportPublicKey(key: CryptoKey): Promise<Uint8Array> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(exported);
}

// HKDF key derivation
async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  // Copy to new ArrayBuffer to avoid SharedArrayBuffer type issues
  const ikmBuffer = new Uint8Array(ikm).buffer;
  const saltBuffer = new Uint8Array(salt).buffer;
  const infoBuffer = new Uint8Array(info).buffer;
  
  const key = await crypto.subtle.importKey('raw', ikmBuffer, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: saltBuffer, info: infoBuffer },
    key,
    length * 8
  );
  return new Uint8Array(bits);
}

// Create info parameter for HKDF
function createInfo(type: string, context: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const info = new Uint8Array(typeBytes.length + 1 + context.length);
  info.set(typeBytes, 0);
  info.set([0], typeBytes.length);
  info.set(context, typeBytes.length + 1);
  return info;
}

// Encrypt payload using aes128gcm
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  // Decode subscription keys
  const userPublicKeyBytes = base64UrlDecode(p256dh);
  const authSecret = base64UrlDecode(auth);

  // Generate server ECDH key pair
  const serverKeyPair = await generateECDHKeyPair();
  const serverPublicKey = await exportPublicKey(serverKeyPair.publicKey);

  // Import user's public key (copy to avoid SharedArrayBuffer issues)
  const userPublicKeyBuffer = new Uint8Array(userPublicKeyBytes).buffer;
  const userPublicKey = await crypto.subtle.importKey(
    'raw',
    userPublicKeyBuffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive shared secret using ECDH
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: userPublicKey },
    serverKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Create context for key derivation (RFC 8291)
  // context = 0x00 || length(client_public) || client_public || length(server_public) || server_public
  const context = new Uint8Array(1 + 2 + 65 + 2 + 65);
  context[0] = 0;
  context[1] = 0;
  context[2] = 65;
  context.set(userPublicKeyBytes, 3);
  context[68] = 0;
  context[69] = 65;
  context.set(serverPublicKey, 70);

  // PRK = HKDF-Extract(auth_secret, shared_secret)
  const prkInfo = new TextEncoder().encode('Content-Encoding: auth\0');
  const prk = await hkdf(authSecret, sharedSecret, prkInfo, 32);

  // IKM = HKDF-Expand(PRK, context, 32)
  const ikmInfo = createInfo('Content-Encoding: aesgcm', context);
  const ikm = await hkdf(salt, prk, ikmInfo, 32);

  // Derive content encryption key: CEK = HKDF-Expand(IKM, "Content-Encoding: aes128gcm" + 0x01, 16)
  const cekInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0\x01');
  const cek = await hkdf(salt, ikm, cekInfo, 16);

  // Derive nonce: NONCE = HKDF-Expand(IKM, "Content-Encoding: nonce" + 0x01, 12)
  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0\x01');
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);

  // Import CEK for AES-GCM (copy to avoid SharedArrayBuffer issues)
  const cekBuffer = new Uint8Array(cek).buffer;
  const aesKey = await crypto.subtle.importKey('raw', cekBuffer, 'AES-GCM', false, ['encrypt']);

  // Add padding (RFC 8291 requires minimum 1 byte padding delimiter + optional padding)
  const payloadBytes = new TextEncoder().encode(payload);
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes, 0);
  paddedPayload[payloadBytes.length] = 2; // Padding delimiter

  // Encrypt with AES-128-GCM (copy nonce to avoid SharedArrayBuffer issues)
  const nonceBuffer = new Uint8Array(nonce).buffer;
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonceBuffer },
    aesKey,
    paddedPayload
  );

  return {
    ciphertext: new Uint8Array(encrypted),
    salt,
    serverPublicKey,
  };
}

// Build aes128gcm body according to RFC 8188
function buildAes128gcmBody(
  salt: Uint8Array,
  serverPublicKey: Uint8Array,
  ciphertext: Uint8Array
): ArrayBuffer {
  // Header: salt (16) || record size (4) || keyid length (1) || keyid (serverPublicKey, 65)
  const recordSize = 4096;
  const keyIdLen = serverPublicKey.length;
  
  const header = new Uint8Array(16 + 4 + 1 + keyIdLen);
  header.set(salt, 0);
  
  // Record size as big-endian uint32
  header[16] = (recordSize >> 24) & 0xff;
  header[17] = (recordSize >> 16) & 0xff;
  header[18] = (recordSize >> 8) & 0xff;
  header[19] = recordSize & 0xff;
  
  header[20] = keyIdLen;
  header.set(serverPublicKey, 21);
  
  // Combine header + ciphertext
  const body = new Uint8Array(header.length + ciphertext.length);
  body.set(header, 0);
  body.set(ciphertext, header.length);
  
  return body.buffer;
}

// Send Web Push notification with VAPID and encryption
async function sendWebPush(
  endpoint: string,
  p256dh: string,
  auth: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string,
  payload: string
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    // Create VAPID JWT
    const vapidToken = await createVapidJWT(endpoint, vapidPublicKey, vapidPrivateKey, vapidSubject);
    
    // Encrypt the payload
    const { ciphertext, salt, serverPublicKey } = await encryptPayload(payload, p256dh, auth);
    
    // Build the body
    const body = buildAes128gcmBody(salt, serverPublicKey, ciphertext);
    
    // Send the request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${vapidToken}, k=${vapidPublicKey}`,
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        'TTL': '86400',
        'Urgency': 'high',
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`Web push error: ${response.status} ${response.statusText}`, errorText);
      return { success: false, status: response.status, error: errorText };
    }

    return { success: true, status: response.status };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Web push encryption/send error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============= Main Handler =============

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firebaseServiceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

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

    // Check if VAPID keys are configured for web push
    const webPushConfigured = vapidPublicKey && vapidPrivateKey;
    if (!webPushConfigured) {
      console.log('VAPID keys not configured - web push will fail');
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
          if (sub.device_type === 'web' && sub.endpoint && sub.p256dh && sub.auth) {
            if (!webPushConfigured) {
              console.error(`VAPID keys not configured for web push ${sub.id}`);
              return { success: false, id: sub.id, error: 'VAPID not configured' };
            }

            console.log(`Sending web push to: ${sub.id}`);
            
            const payload = JSON.stringify({
              title,
              body,
              icon: icon || '/favicon.png',
              badge: '/favicon.png',
              url: url || '/app/messages',
              tag: tag || 'message',
            });

            const result = await sendWebPush(
              sub.endpoint,
              sub.p256dh,
              sub.auth,
              vapidPublicKey!,
              vapidPrivateKey!,
              'mailto:support@fishx.app',
              payload
            );

            console.log(`Web push response for ${sub.id}: ${result.status}`);

            if (!result.success) {
              console.error(`Web push failed for ${sub.id}: ${result.status} ${result.error}`);
              
              // Remove invalid subscription
              if (result.status === 404 || result.status === 410) {
                await supabase
                  .from('push_subscriptions')
                  .delete()
                  .eq('id', sub.id);
                console.log(`Removed invalid web subscription: ${sub.id}`);
              }
              return { success: false, id: sub.id, status: result.status, error: result.error };
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
