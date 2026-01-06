import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  ticketId: string;
  type: "status_update" | "admin_response";
  message?: string;
  newStatus?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId, type, message, newStatus }: EmailRequest = await req.json();
    console.log(`Sending ${type} email for ticket:`, ticketId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const statusDisplay = (newStatus || ticket.status).replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase());

    let emailSubject = "";
    let emailBody = "";

    if (type === "status_update") {
      emailSubject = `Ticket #${ticket.ticket_number} - Status Update`;
      emailBody = `
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #111827; margin-bottom: 16px;">Ticket Status Update</h2>
              <p style="color: #374151;">Hi ${ticket.name},</p>
              <p style="color: #374151;">Your support ticket <strong>#${ticket.ticket_number}</strong> has been updated.</p>
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #374151;">New Status: <strong style="color: #059669;">${statusDisplay}</strong></p>
              </div>
              ${message ? `<p style="color: #374151;"><strong>Message:</strong> ${message}</p>` : ""}
              <p style="color: #374151;">You can view your ticket and respond at any time by visiting your account.</p>
              <p style="color: #6b7280; margin-top: 24px;">Thanks,<br>Find Fishing Dates Team</p>
            </div>
          </body>
        </html>
      `;
    } else {
      emailSubject = `Re: Ticket #${ticket.ticket_number} - ${ticket.subject}`;
      emailBody = `
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #111827; margin-bottom: 16px;">New Response to Your Ticket</h2>
              <p style="color: #374151;">Hi ${ticket.name},</p>
              <p style="color: #374151;">Our support team has responded to your ticket <strong>#${ticket.ticket_number}</strong>:</p>
              <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #0c4a6e; white-space: pre-wrap;">${message?.replace(/\n/g, "<br>")}</p>
              </div>
              <p style="color: #374151;">You can reply to this message by logging into your account and visiting your support tickets.</p>
              <p style="color: #6b7280; margin-top: 24px;">Thanks,<br>Find Fishing Dates Team</p>
            </div>
          </body>
        </html>
      `;
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Find Fishing Dates <onboarding@resend.dev>",
        to: [ticket.email],
        subject: emailSubject,
        html: emailBody,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      console.error("Email send error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);
