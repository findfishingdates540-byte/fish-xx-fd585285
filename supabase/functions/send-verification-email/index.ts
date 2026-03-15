import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  displayName: string;
  verificationType: "id" | "live";
  status: "approved" | "rejected";
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, displayName, verificationType, status, rejectionReason }: VerificationEmailRequest = await req.json();

    console.log(`Sending verification email to ${email} for ${verificationType} verification: ${status}`);

    const typeLabel = verificationType === "id" ? "ID Verification" : "Live Verification";
    const isApproved = status === "approved";

    const subject = isApproved
      ? `✅ Your ${typeLabel} has been approved!`
      : `❌ Your ${typeLabel} request was not approved`;

    const html = `
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
          <!-- Header -->
          <tr>
            <td style="background-color: ${isApproved ? '#10B981' : '#EF4444'}; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                ${isApproved ? '🎉 Verification Approved!' : '📋 Verification Update'}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Hi ${displayName || 'there'},
              </p>
              
              ${isApproved ? `
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Great news! Your <strong>${typeLabel}</strong> request has been approved. You now have a ${verificationType === 'id' ? 'white verification badge' : 'blue verification badge'} on your profile!
              </p>
              
              <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 14px; color: #065F46; font-weight: 500;">
                  ${verificationType === 'id' 
                    ? '✓ Your identity has been verified. Other users will see a white check mark next to your name.' 
                    : '✓ Your live verification is complete. Other users will see a blue check mark next to your name.'}
                </p>
              </div>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Verified members are more trusted in our community and often have better connections!
              </p>
              ` : `
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Unfortunately, we were unable to approve your <strong>${typeLabel}</strong> request at this time.
              </p>
              
              ${rejectionReason ? `
              <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 8px; font-size: 12px; color: #B91C1C; font-weight: 600; text-transform: uppercase;">
                  Reason
                </p>
                <p style="margin: 0; font-size: 14px; color: #991B1B;">
                  ${rejectionReason}
                </p>
              </div>
              ` : ''}
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                You can submit a new verification request from your Settings page. Please ensure your documents are clear and meet our requirements.
              </p>
              `}
              
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td style="background-color: #111827; border-radius: 8px;">
                    <a href="https://findfishingdates.net/app/settings" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px;">
                      ${isApproved ? 'View Your Profile' : 'Submit New Request'}
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 14px; color: #6B7280;">
                If you have any questions, feel free to contact our support team.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px 40px; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF; text-align: center;">
                © ${new Date().getFullYear()} FishX. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Find Fishing Dates <team@findfishingdates.net>",
      to: [email],
      subject,
      html,
    });

    console.log("Verification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
