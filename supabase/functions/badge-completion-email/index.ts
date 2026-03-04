import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BadgeEmailRequest {
  email: string;
  full_name: string;
  badge_name: string;
  badge_level: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, full_name, badge_name, badge_level } = (await req.json()) as BadgeEmailRequest;

    if (!email || !badge_name) {
      return new Response(JSON.stringify({ error: "Missing email or badge_name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = full_name || "Champion";

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
        to: [email],
        subject: `🏆 Congratulations! You completed ${badge_name}!`,
        html,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
