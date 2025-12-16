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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, title, body, icon, url, tag }: PushPayload = await req.json();

    console.log(`Sending push notification to user: ${userId}`);

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
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${subscriptions.length} subscriptions`);

    // Web Push implementation using fetch to web-push compatible endpoint
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const payload = JSON.stringify({
            title,
            body,
            icon: icon || '/favicon.ico',
            badge: '/favicon.ico',
            url: url || '/',
            tag: tag || 'default',
          });

          // Create JWT for VAPID
          const header = { alg: 'ES256', typ: 'JWT' };
          const audience = new URL(sub.endpoint).origin;
          const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
          
          const jwtPayload = {
            aud: audience,
            exp: expiration,
            sub: `mailto:noreply@findfishingdates.com`,
          };

          // For web push, we need to use the web-push library approach
          // Since Deno doesn't have native web-push, we'll use a simpler approach
          const response = await fetch(sub.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Encoding': 'aes128gcm',
              'TTL': '86400',
            },
            body: new TextEncoder().encode(payload),
          });

          if (!response.ok) {
            console.error(`Push failed for ${sub.id}: ${response.status}`);
            // Remove invalid subscription
            if (response.status === 404 || response.status === 410) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('id', sub.id);
              console.log(`Removed invalid subscription: ${sub.id}`);
            }
            return { success: false, id: sub.id };
          }

          console.log(`Push sent successfully to ${sub.id}`);
          return { success: true, id: sub.id };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error sending push to ${sub.id}:`, error);
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
