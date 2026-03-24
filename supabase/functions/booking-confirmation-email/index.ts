import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.user.id;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { booking_id } = await req.json();
    if (!booking_id) {
      return new Response(JSON.stringify({ error: "booking_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch booking from DB — only allow if it belongs to the caller
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("full_name, email, activity_name, booking_date, booking_time, court_type")
      .eq("id", booking_id)
      .eq("user_id", callerId)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found or access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { full_name, email, activity_name, booking_date, booking_time, court_type } = booking;

    const courtLine = court_type ? `<p style="margin:0 0 8px"><strong>Court:</strong> ${court_type === "full" ? "Full Court" : "Half Court"}</p>` : "";

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#141414;border-radius:16px;overflow:hidden;border:1px solid #222;">
    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px 28px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Booking Confirmed ✓</h1>
    </div>
    <div style="padding:28px;">
      <p style="color:#ccc;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Hi <strong style="color:#fff;">${full_name}</strong>, thanks for booking with us! Here are your details:
      </p>
      <div style="background:#1a1a1a;border-radius:12px;padding:20px;border:1px solid #2a2a2a;">
        <p style="margin:0 0 8px;color:#ccc;font-size:14px;"><strong style="color:#fff;">Activity:</strong> ${activity_name}</p>
        <p style="margin:0 0 8px;color:#ccc;font-size:14px;"><strong style="color:#fff;">Date:</strong> ${booking_date}</p>
        <p style="margin:0 0 ${court_type ? "8px" : "0"};color:#ccc;font-size:14px;"><strong style="color:#fff;">Time:</strong> ${booking_time}</p>
        ${courtLine ? `<p style="margin:0;color:#ccc;font-size:14px;">${courtLine}</p>` : ""}
      </div>
      <p style="color:#888;font-size:13px;margin:24px 0 0;text-align:center;">
        See you there! 🎾🏀🧘
      </p>
    </div>
  </div>
</body>
</html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Bookings <onboarding@resend.dev>",
        to: [email],
        subject: `Booking Confirmed — ${activity_name}`,
        html: htmlBody,
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      throw new Error(`Resend API failed [${resendRes.status}]: ${JSON.stringify(resendData)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error sending confirmation email:", err);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
