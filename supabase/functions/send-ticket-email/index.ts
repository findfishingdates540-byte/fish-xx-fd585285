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
      emailBody = `<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2>Ticket Status Update</h2><p>Hi ${ticket.name},</p><p>Your ticket <strong>${ticket.ticket_number}</strong> status is now: <strong>${statusDisplay}</strong></p>${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}<p>Thanks,<br>Find Fishing Dates Team</p></body></html>`;
    } else {
      emailSubject = `Re: Ticket #${ticket.ticket_number} - ${ticket.subject}`;
      emailBody = `<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2>New Response</h2><p>Hi ${ticket.name},</p><p>Our team responded:</p><div style="background:#f5f5f5;padding:15px;border-radius:8px;">${message?.replace(/\n/g, "<br>")}</div><p>Thanks,<br>Find Fishing Dates Team</p></body></html>`;
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: "Find Fishing Dates <onboarding@resend.dev>", to: [ticket.email], subject: emailSubject, html: emailBody }),
    });

    console.log("Email sent:", await emailRes.json());
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);
