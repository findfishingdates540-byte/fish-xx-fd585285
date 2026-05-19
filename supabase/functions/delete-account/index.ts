import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting per user
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: allowed } = await adminClient.rpc('check_rate_limit', {
      p_key: `delete-account:${user.id}`,
      p_max_requests: 3,
      p_window_seconds: 3600,
    });
    if (allowed === false) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete profile (cascades or RLS will handle related data)
    await adminClient.from("profiles").delete().eq("id", user.id);

    // Delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete account" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send farewell email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && user.email) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "FishX <team@fish-x.com>",
            to: [user.email],
            subject: "Your account has been deleted",
            html: `
              <div style="font-family: 'Outfit', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #fff;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <h1 style="font-size: 24px; color: #000;">Account Deleted</h1>
                </div>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi there,</p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">Your FishX account has been permanently deleted as requested. All your data, catches, messages, and profile information have been removed.</p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">We're sorry to see you go. If you ever want to come back, you can create a new account at any time at <a href="https://fishx.app" style="color: #2563eb;">fishx.app</a>.</p>
                <p style="color: #666; font-size: 14px; margin-top: 32px;">— The FishX Team 🎣</p>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error("Failed to send farewell email:", emailErr);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Delete account error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
