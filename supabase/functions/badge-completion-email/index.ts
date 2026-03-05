import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    // 2. Parse request body
    const { badge_name, badge_level } = await req.json();

    if (!badge_name || badge_level == null) {
      return new Response(JSON.stringify({ error: "Missing badge_name or badge_level" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Verify the badge was actually earned by this user via service role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: assignment, error: assignErr } = await adminClient
      .from("badge_point_assignments")
      .select("id")
      .eq("user_id", userId)
      .eq("badge_level", badge_level)
      .limit(1)
      .maybeSingle();

    if (assignErr || !assignment) {
      return new Response(JSON.stringify({ error: "Badge not earned by this user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Get user's profile name (send email only to the authenticated user's own email)
    const { data: profile } = await adminClient
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .maybeSingle();

    const name = profile?.full_name || "Champion";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #eab308); width: 70px; height: 70px; border-radius: 20px; line-height: 70px; font-size: 32px;">
            🏆
          </div>
        </div>
        <h1 style="text-align: center; font-size: 24px; color: #1a1a1a; margin-bottom: 10px;">
          Congratulations, ${name}! 🎉
        </h1>
        <p style="text-align: center; color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
          You just completed <strong style="color: #1a1a1a;">${badge_name}</strong> in the Habit Tracker!
        </p>
        <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 25px;">
          <p style="color: #92400e; font-size: 15px; margin: 0; line-height: 1.5;">
            🎁 <strong>You earned a free loyalty point!</strong><br/>
            Head to your profile to add +1 to any club of your choice.
          </p>
        </div>
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="https://summitwellnesshub.lovable.app/profile" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 15px;">
            Go to My Profile
          </a>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px;">
          Keep going — more levels and rewards await! 💪
        </p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Summit Wellness <notifications@notify.summitwellnesshub.com>",
        to: [userEmail],
        subject: `🏆 Congratulations! You completed ${badge_name}!`,
        html,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
