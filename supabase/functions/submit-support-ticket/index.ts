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

interface TicketRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  userId?: string;
}

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
      p_key: `submit-ticket:${ip}`,
      p_max_requests: 5,
      p_window_seconds: 900,
    });
    if (allowed === false) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { name, email, subject, message, category, userId }: TicketRequest = await req.json();

    // Input validation with length limits
    if (!name || !email || !subject || !message || !category) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (name.length > 100) {
      return new Response(
        JSON.stringify({ error: "Name must be less than 100 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Email must be less than 255 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (subject.length > 200) {
      return new Response(
        JSON.stringify({ error: "Subject must be less than 200 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (message.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Message must be less than 5000 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Creating support ticket for:", email);

    // Sanitize all user inputs for HTML email templates
    const safeName = escapeHtml(name);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);
    const safeCategory = escapeHtml(category);

    const { data: ticket, error: insertError } = await supabase
      .from("support_tickets")
      .insert({
        name,
        email,
        subject,
        message,
        category,
        user_id: userId || null,
        status: "open",
        priority: "medium",
      })
      .select("id, ticket_number")
      .single();

    if (insertError) {
      console.error("Error creating ticket:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create support ticket" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Ticket created:", ticket.ticket_number);

    // Send confirmation email to user (with sanitized content)
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ea5e9, #0284c7); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">We Received Your Message</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
            <p>Hi ${safeName},</p>
            <p>Thank you for contacting Find Fishing Dates!</p>
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p><strong>Ticket Number:</strong> <span style="color: #0ea5e9;">${ticket.ticket_number}</span></p>
              <p><strong>Subject:</strong> ${safeSubject}</p>
              <p><strong>Category:</strong> ${safeCategory}</p>
            </div>
            <p>Our team will respond within 24-48 hours.</p>
            <p>Best regards,<br><strong>The Find Fishing Dates Team</strong></p>
          </div>
        </body>
        </html>
      `;

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Find Fishing Dates <onboarding@resend.dev>",
          to: [email],
          subject: `Ticket #${ticket.ticket_number} - We received your message`,
          html: emailHtml,
        }),
      });

      console.log("Confirmation email sent:", await emailRes.json());
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
    }

    // Send notification email to admin (with sanitized content)
    try {
      const adminEmailHtml = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">🎫 New Support Ticket</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
            <p>A new support ticket has been submitted:</p>
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p><strong>Ticket Number:</strong> <span style="color: #0ea5e9;">${ticket.ticket_number}</span></p>
              <p><strong>From:</strong> ${safeName} (${escapeHtml(email)})</p>
              <p><strong>Category:</strong> ${safeCategory}</p>
              <p><strong>Subject:</strong> ${safeSubject}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;" />
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap; background: #f3f4f6; padding: 15px; border-radius: 6px;">${safeMessage}</p>
            </div>
            <p style="text-align: center;">
              <a href="https://findfishingdates.com/admin/support" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">View in Admin Panel</a>
            </p>
          </div>
        </body>
        </html>
      `;

      const adminEmailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Find Fishing Dates <onboarding@resend.dev>",
          to: ["findfishingdates540@gmail.com"],
          subject: `[NEW TICKET] ${ticket.ticket_number} - ${safeSubject}`,
          html: adminEmailHtml,
        }),
      });

      console.log("Admin notification email sent:", await adminEmailRes.json());
    } catch (adminEmailError) {
      console.error("Failed to send admin notification email:", adminEmailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticketNumber: ticket.ticket_number,
        ticketId: ticket.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in submit-support-ticket:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
