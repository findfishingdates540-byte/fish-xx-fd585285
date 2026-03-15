import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface EmailRequest {
  ticketId: string;
  type: "status_update" | "admin_response" | "ticket_resolved" | "ticket_closed" | "ticket_reopened";
  message?: string;
  newStatus?: string;
  reopenReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId, type, message, newStatus, reopenReason }: EmailRequest = await req.json();
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

    const statusDisplay = escapeHtml((newStatus || ticket.status).replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase()));
    const safeName = escapeHtml(ticket.name);
    const safeEmail = escapeHtml(ticket.email);
    const safeSubject = escapeHtml(ticket.subject);

    let emailSubject = "";
    let emailBody = "";

    if (type === "ticket_reopened") {
      // Send to admin
      emailSubject = `Ticket #${ticket.ticket_number} Reopened - Action Required`;
      emailBody = `
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; background: #fef3c7; color: #92400e; padding: 12px 24px; border-radius: 50px; font-weight: 600;">
                  ⚠️ Ticket Reopened
                </div>
              </div>
              <h2 style="color: #111827; margin-bottom: 16px;">A User Has Reopened Their Ticket</h2>
              <p style="color: #374151;"><strong>${safeName}</strong> (${safeEmail}) has reopened ticket <strong>#${ticket.ticket_number}</strong>.</p>
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;"><strong>Subject:</strong></p>
                <p style="margin: 0; color: #111827;">${safeSubject}</p>
              </div>
              ${reopenReason ? `
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px;"><strong>Reason for reopening:</strong></p>
                <p style="margin: 0; color: #78350f; white-space: pre-wrap;">${escapeHtml(reopenReason).replace(/\n/g, "<br>")}</p>
              </div>
              ` : ""}
              <p style="color: #374151;">Please review this ticket and respond to the user.</p>
              <div style="margin-top: 24px; text-align: center;">
                <a href="https://fishx.app/admin/support-tickets" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">View in Admin Panel</a>
              </div>
            </div>
          </body>
        </html>
      `;

      // Send to admin email
      const adminEmailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
           from: "FishX <team@fishx.app>",
          to: ["findfishingdates540@gmail.com"],
          subject: emailSubject,
          html: emailBody,
        }),
      });

      const adminEmailData = await adminEmailRes.json();
      if (!adminEmailRes.ok) {
        console.error("Admin email send error:", adminEmailData);
      } else {
        console.log("Admin notification sent:", adminEmailData);
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } else if (type === "ticket_resolved") {
      emailSubject = `Ticket #${ticket.ticket_number} - Issue Resolved ✓`;
      emailBody = `
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; background: #d1fae5; color: #065f46; padding: 12px 24px; border-radius: 50px; font-weight: 600;">
                  ✓ Issue Resolved
                </div>
              </div>
              <h2 style="color: #111827; margin-bottom: 16px;">Your Ticket Has Been Resolved</h2>
              <p style="color: #374151;">Hi ${safeName},</p>
              <p style="color: #374151;">Great news! Your support ticket <strong>#${ticket.ticket_number}</strong> regarding "<em>${safeSubject}</em>" has been resolved.</p>
              ${message ? `<div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;"><p style="margin: 0; color: #166534; white-space: pre-wrap;">${escapeHtml(message).replace(/\n/g, "<br>")}</p></div>` : ""}
              <p style="color: #374151;">If you have any further questions or need additional assistance, feel free to open a new ticket.</p>
              <p style="color: #6b7280; margin-top: 24px;">Thanks for your patience,<br>FishX Team</p>
            </div>
          </body>
        </html>
      `;
    } else if (type === "ticket_closed") {
      emailSubject = `Ticket #${ticket.ticket_number} - Closed`;
      emailBody = `
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #111827; margin-bottom: 16px;">Your Ticket Has Been Closed</h2>
              <p style="color: #374151;">Hi ${safeName},</p>
              <p style="color: #374151;">Your support ticket <strong>#${ticket.ticket_number}</strong> regarding "<em>${safeSubject}</em>" has been closed.</p>
              ${message ? `<div style="background: #f3f4f6; padding: 16px; margin: 20px 0; border-radius: 8px;"><p style="margin: 0; color: #374151; white-space: pre-wrap;">${escapeHtml(message).replace(/\n/g, "<br>")}</p></div>` : ""}
              <p style="color: #374151;">If you need further assistance, you can always submit a new support ticket.</p>
              <p style="color: #6b7280; margin-top: 24px;">Thanks,<br>FishX Team</p>
            </div>
          </body>
        </html>
      `;
    } else if (type === "status_update") {
      emailSubject = `Ticket #${ticket.ticket_number} - Status Update`;
      emailBody = `
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #111827; margin-bottom: 16px;">Ticket Status Update</h2>
              <p style="color: #374151;">Hi ${safeName},</p>
              <p style="color: #374151;">Your support ticket <strong>#${ticket.ticket_number}</strong> has been updated.</p>
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #374151;">New Status: <strong style="color: #059669;">${statusDisplay}</strong></p>
              </div>
              ${message ? `<p style="color: #374151;"><strong>Message:</strong> ${escapeHtml(message)}</p>` : ""}
              <p style="color: #374151;">You can view your ticket and respond at any time by visiting your account.</p>
              <p style="color: #6b7280; margin-top: 24px;">Thanks,<br>FishX Team</p>
            </div>
          </body>
        </html>
      `;
    } else {
      emailSubject = `Re: Ticket #${ticket.ticket_number} - ${safeSubject}`;
      emailBody = `
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #111827; margin-bottom: 16px;">New Response to Your Ticket</h2>
              <p style="color: #374151;">Hi ${safeName},</p>
              <p style="color: #374151;">Our support team has responded to your ticket <strong>#${ticket.ticket_number}</strong>:</p>
              <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #0c4a6e; white-space: pre-wrap;">${message ? escapeHtml(message).replace(/\n/g, "<br>") : ""}</p>
              </div>
              <p style="color: #374151;">You can reply to this message by logging into your account and visiting your support tickets.</p>
              <p style="color: #6b7280; margin-top: 24px;">Thanks,<br>FishX Team</p>
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
        from: "FishX <team@findfishingdates.net>",
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
