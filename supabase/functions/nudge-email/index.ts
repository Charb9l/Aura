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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { receiver_id, sport_id } = await req.json();
    if (!receiver_id || !sport_id) {
      return new Response(JSON.stringify({ error: "Missing params" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch data
    const [senderProfile, receiverAuth, sportRes] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("user_id", user.id).single(),
      supabase.auth.admin.getUserById(receiver_id),
      supabase.from("offerings").select("name").eq("id", sport_id).single(),
    ]);

    const senderName = senderProfile.data?.full_name || "Someone";
    const receiverEmail = receiverAuth.data?.user?.email;
    const sportName = sportRes.data?.name || "a sport";

    if (!receiverEmail || !resendKey) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Elevate Wellness Hub <notifications@mail.summitwellnesshub.lovable.app>",
        to: [receiverEmail],
        subject: `🏋️ ${senderName} wants to be your ${sportName} buddy!`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 30px;">
            <h2 style="color: #333;">You've got a Nudge! 🎯</h2>
            <p style="color: #555; font-size: 16px;">
              <strong>${senderName}</strong> wants to be your <strong>${sportName}</strong> workout buddy!
            </p>
            <p style="color: #555; font-size: 14px;">
              Log in to your profile to accept or decline this nudge. If you accept, you'll be able to see each other's contact info.
            </p>
            <div style="margin-top: 24px;">
              <a href="https://summitwellnesshub.lovable.app/profile" 
                 style="display: inline-block; background: #7c3aed; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                View Nudge
              </a>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              — Elevate Wellness Hub
            </p>
          </div>
        `,
      }),
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
