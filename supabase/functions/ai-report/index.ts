import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify the user is admin
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authErr } = await adminClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) throw new Error("Unauthorized");

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Admin access required");

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      throw new Error("Prompt is required");
    }

    // Fetch all bookings data for context
    const { data: bookings } = await adminClient
      .from("bookings")
      .select("*")
      .order("booking_date", { ascending: false });

    const { data: clubs } = await adminClient
      .from("clubs")
      .select("id, name, offerings");

    const { data: profiles } = await adminClient
      .from("profiles")
      .select("user_id, full_name, phone");

    const totalBookings = bookings?.length || 0;
    const dateRange = bookings && bookings.length > 0
      ? `${bookings[bookings.length - 1].booking_date} to ${bookings[0].booking_date}`
      : "no data";

    const activitiesSummary = bookings ? [...new Set(bookings.map(b => b.activity))].join(", ") : "none";
    const clubsSummary = clubs?.map(c => `${c.name} (offerings: ${c.offerings.join(", ")})`).join("; ") || "none";

    // Build a compact data representation for the AI
    const bookingsJson = JSON.stringify(bookings?.map(b => ({
      id: b.id,
      date: b.booking_date,
      time: b.booking_time,
      activity: b.activity,
      activity_name: b.activity_name,
      customer: b.full_name,
      email: b.email,
      phone: b.phone,
      status: b.status,
      court_type: b.court_type,
      discount_type: b.discount_type,
      attendance: b.attendance_status,
      created_by: b.created_by,
      created_at: b.created_at,
    })) || []);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a data analyst assistant for Elevate Wellness Hub, a multi-sport booking and wellness platform in Lebanon.

You have access to the following data:
- ${totalBookings} bookings spanning ${dateRange}
- Activities: ${activitiesSummary}
- Clubs: ${clubsSummary}

PRICING RULES:
- Tennis: $15/session
- Aerial Yoga: $20/session
- Pilates: $20/session
- Basketball Half Court: $45/session
- Basketball Full Court: $90/session
- If discount_type is "free", revenue = $0
- If discount_type is "50%", revenue = base * 0.5

Here is the complete bookings data:
${bookingsJson}

The admin will ask you a question about their data. You MUST respond with a valid JSON object with this exact structure:
{
  "summary": "A brief human-readable summary of the findings",
  "csv_headers": ["Column1", "Column2", ...],
  "csv_rows": [["val1", "val2", ...], ...]
}

Rules:
- Always generate relevant CSV data that answers the question
- Include useful columns like dates, counts, revenue, percentages where appropriate
- If the question involves a date range, filter accordingly
- If the question is vague, make reasonable assumptions and mention them in the summary
- Keep the summary concise (2-3 sentences max)
- Ensure all CSV values are strings
- RESPOND WITH ONLY THE JSON OBJECT, no markdown, no code blocks`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI service error");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    // Strip markdown code blocks if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI returned an invalid response. Please try rephrasing your question.");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
