import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { data: allowed } = await supabase.rpc('check_rate_limit', {
      p_key: `verify-reminder:${ip}`,
      p_max_requests: 3,
      p_window_seconds: 3600,
    });
    if (allowed === false) {
      return new Response(
        JSON.stringify({ error: "Too many requests" }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: unverifiedUsers, error: fetchError } = await supabase
      .from("profiles")
      .select("id, email, display_name, created_at, verification_reminder_sent_at")
      .or("id_verified.is.null,id_verified.eq.false")
      .or("live_verified.is.null,live_verified.eq.false")
      .lt("created_at", sevenDaysAgo.toISOString())
      .not("email", "is", null);

    if (fetchError) {
      console.error("Error fetching unverified users:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${unverifiedUsers?.length || 0} potentially unverified users`);

    const usersToNotify = unverifiedUsers?.filter(user => {
      if (!user.verification_reminder_sent_at) return true;
      const lastReminder = new Date(user.verification_reminder_sent_at);
      return lastReminder < sevenDaysAgo;
    }) || [];

    console.log(`${usersToNotify.length} users will receive reminders`);

    const results = [];

    for (const user of usersToNotify) {
      if (!user.email) continue;

      try {
        const emailResponse = await resend.emails.send({
          from: "FishX <team@fish-x.com>",
          to: [user.email],
          subject: "🎣 Complete your verification to get more connections!",
          html: generateReminderEmail(user.display_name || "there"),
        });

        console.log(`Reminder sent to ${user.email}:`, emailResponse);

        await supabase
          .from("profiles")
          .update({ verification_reminder_sent_at: new Date().toISOString() })
          .eq("id", user.id);

        results.push({ userId: user.id, email: user.email, status: "sent" });
      } catch (emailError) {
        console.error(`Failed to send reminder to ${user.email}:`, emailError);
        results.push({ userId: user.id, email: user.email, status: "failed", error: String(emailError) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, totalProcessed: usersToNotify.length, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-verification-reminder function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

function generateReminderEmail(displayName: string): string {
  // Sanitize displayName for HTML
  const safeName = displayName.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f8f9fa;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: #3B82F6; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">🛡️ Get Verified Today!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Hi ${safeName},</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">We noticed you haven't completed your profile verification yet. Verified members get:</p>
              <div style="background-color: #EFF6FF; padding: 20px; margin: 24px 0; border-radius: 12px;">
                <ul style="margin: 0; padding: 0 0 0 20px; color: #1D4ED8;">
                  <li style="margin-bottom: 8px;">✓ More profile views and connections</li>
                  <li style="margin-bottom: 8px;">✓ A trust badge that others can see</li>
                  <li style="margin-bottom: 8px;">✓ Priority in search results</li>
                  <li>✓ Access to verified-only features</li>
                </ul>
              </div>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">It only takes a few minutes! Complete your ID verification or Live verification to stand out from the crowd.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td style="background-color: #111827; border-radius: 8px;">
                    <a href="https://fishx.app/app/settings" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px;">Get Verified Now →</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 14px; color: #6B7280;">Questions? Contact our support team anytime.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px 40px; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF; text-align: center;">© ${new Date().getFullYear()} FishX. All rights reserved.</p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #9CA3AF; text-align: center;">You're receiving this because you signed up for FishX.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

serve(handler);
