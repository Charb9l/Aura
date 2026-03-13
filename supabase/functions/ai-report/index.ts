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

    // Fetch all data sources in parallel
    const [bookingsRes, clubsRes, pricesRes, profilesRes, usersRes, nudgesRes, academyRegsRes, workoutBuddiesRes, offeringsRes, locationsRes, formerUsersRes, promotionsRes] = await Promise.all([
      adminClient.from("bookings").select("*").order("booking_date", { ascending: false }).limit(500),
      adminClient.from("clubs").select("id, name, offerings, has_academy, published"),
      adminClient.from("club_activity_prices").select("club_id, activity_slug, price, price_label"),
      adminClient.from("profiles").select("user_id, full_name, phone, created_at, suspended"),
      adminClient.auth.admin.listUsers({ perPage: 1000 }),
      adminClient.from("nudges").select("id, sender_id, receiver_id, sport_id, status, created_at, responded_at").order("created_at", { ascending: false }).limit(500),
      adminClient.from("academy_registrations").select("*").order("created_at", { ascending: false }).limit(500),
      adminClient.from("workout_buddies").select("id, user_id_1, user_id_2, sport_id, created_at").order("created_at", { ascending: false }).limit(500),
      adminClient.from("offerings").select("id, name, slug"),
      adminClient.from("locations").select("id, name"),
      adminClient.from("former_users").select("*").order("ended_at", { ascending: false }).limit(200),
      adminClient.from("user_promotions").select("*").order("created_at", { ascending: false }).limit(500),
    ]);

    const bookings = bookingsRes.data || [];
    const clubs = clubsRes.data || [];
    const prices = pricesRes.data || [];
    const profiles = profilesRes.data || [];
    const authUsers = usersRes.data?.users || [];
    const nudges = nudgesRes.data || [];
    const academyRegs = academyRegsRes.data || [];
    const workoutBuddies = workoutBuddiesRes.data || [];
    const offerings = offeringsRes.data || [];
    const locations = locationsRes.data || [];
    const formerUsers = formerUsersRes.data || [];
    const promotions = promotionsRes.data || [];

    // Build customer list (merge profiles + auth emails)
    const customers = profiles.map(p => {
      const authUser = authUsers.find(u => u.id === p.user_id);
      return {
        name: p.full_name || "—",
        email: authUser?.email || "—",
        phone: p.phone || "—",
        signed_up: p.created_at?.slice(0, 10) || "—",
      };
    });

    // Build club → activities mapping
    const clubActivityMap: Record<string, string[]> = {};
    clubs.forEach(c => {
      const activities: string[] = [];
      c.offerings.forEach((o: string) => {
        const lower = o.toLowerCase();
        if (lower.includes("basketball")) activities.push("basketball");
        if (lower.includes("tennis")) activities.push("tennis");
        if (lower.includes("pilates")) activities.push("pilates");
        if (lower.includes("yoga") || lower.includes("aerial")) activities.push("aerial-yoga");
      });
      clubActivityMap[c.id] = activities;
    });

    // Build pricing string from actual DB data
    const pricingLines: string[] = [];
    prices.forEach(p => {
      const club = clubs.find(c => c.id === p.club_id);
      const clubName = club?.name || "Unknown";
      const label = p.price_label ? ` (${p.price_label})` : "";
      pricingLines.push(`${clubName} — ${p.activity_slug}${label}: $${p.price}`);
    });
    const pricingStr = pricingLines.length > 0 ? pricingLines.join("\n") : "No pricing data available";

    // Helper to resolve price for a booking
    const getBookingRevenue = (b: any): number => {
      if (b.attendance_status !== "show") return 0;
      if (b.price != null) {
        const storedBase = Number(b.price);
        if (b.discount_type === "free") return 0;
        if (b.discount_type === "50%") return storedBase * 0.5;
        return storedBase;
      }
      let clubId: string | undefined;
      for (const [cid, acts] of Object.entries(clubActivityMap)) {
        if (acts.includes(b.activity)) { clubId = cid; break; }
      }
      let basePrice = 0;
      if (clubId) {
        const match = prices.find(p =>
          p.club_id === clubId &&
          p.activity_slug === b.activity &&
          (b.court_type ? p.price_label === b.court_type : !p.price_label || true)
        );
        if (match) basePrice = Number(match.price);
      }
      if (!basePrice) {
        const fallback = prices.find(p => p.activity_slug === b.activity && (b.court_type ? p.price_label === b.court_type : true));
        if (fallback) basePrice = Number(fallback.price);
      }
      if (b.discount_type === "free") return 0;
      if (b.discount_type === "50%") return basePrice * 0.5;
      return basePrice;
    };

    const totalBookings = bookings.length;
    const dateRange = bookings.length > 0
      ? `${bookings[bookings.length - 1].booking_date} to ${bookings[0].booking_date}`
      : "no data";

    const activitiesSummary = [...new Set(bookings.map(b => b.activity))].join(", ") || "none";
    const clubsSummary = clubs.map(c => `${c.name} (offerings: ${c.offerings.join(", ")})`).join("; ") || "none";

    // Compact bookings
    const bookingsJson = JSON.stringify(bookings.map(b => ({
      date: b.booking_date,
      time: b.booking_time,
      act: b.activity,
      act_name: b.activity_name,
      name: b.full_name,
      email: b.email,
      phone: b.phone,
      status: b.status,
      court: b.court_type || "",
      discount: b.discount_type || "",
      attendance: b.attendance_status || "",
      created_at: b.created_at,
      revenue: getBookingRevenue(b),
    })));

    const customersJson = JSON.stringify(customers);

    // Build offering lookup
    const offeringMap: Record<string, string> = {};
    offerings.forEach(o => { offeringMap[o.id] = o.name; });

    // Build profile lookup for nudges
    const profileMap: Record<string, string> = {};
    profiles.forEach(p => { profileMap[p.user_id] = p.full_name || "Unknown"; });

    // Nudges data
    const nudgesJson = JSON.stringify(nudges.map(n => ({
      sender: profileMap[n.sender_id] || n.sender_id,
      receiver: profileMap[n.receiver_id] || n.receiver_id,
      sport: offeringMap[n.sport_id] || n.sport_id,
      status: n.status,
      created: n.created_at?.slice(0, 10) || "",
      responded: n.responded_at?.slice(0, 10) || "",
    })));

    // Academy registrations data
    const academyRegsJson = JSON.stringify(academyRegs.map(r => ({
      name: r.full_name,
      email: r.email,
      phone: r.phone,
      club: r.club_name,
      location: r.location_name || "",
      age: r.age ?? "",
      experience: r.experience || "",
      status: r.status,
      date: r.created_at?.slice(0, 10) || "",
    })));

    // Workout buddies data
    const buddiesJson = JSON.stringify(workoutBuddies.map(wb => ({
      user1: profileMap[wb.user_id_1] || wb.user_id_1,
      user2: profileMap[wb.user_id_2] || wb.user_id_2,
      sport: offeringMap[wb.sport_id] || wb.sport_id,
      created: wb.created_at?.slice(0, 10) || "",
    })));

    // Former users data
    const formerUsersJson = JSON.stringify(formerUsers.map(fu => ({
      name: fu.full_name || "",
      email: fu.email,
      phone: fu.phone || "",
      type: fu.user_type,
      club: fu.club_name || "",
      reason: fu.reason || "",
      started: fu.started_at?.slice(0, 10) || "",
      ended: fu.ended_at?.slice(0, 10) || "",
    })));

    // Promotions data
    const promotionsJson = JSON.stringify(promotions.map(p => ({
      user: profileMap[p.user_id] || p.user_id,
      type: p.discount_type,
      value: p.discount_value,
      remaining: p.remaining_uses,
      source: p.source,
      created: p.created_at?.slice(0, 10) || "",
    })));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const today = new Date();
    const currentYear = today.getUTCFullYear();
    const currentMonth = today.getUTCMonth();
    const firstOfMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getUTCDate();
    const lastOfMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const todayStr = today.toISOString().slice(0, 10);

    const systemPrompt = `You are a data analyst for a multi-sport booking and community platform in Lebanon.

TODAY'S DATE: ${todayStr}
CURRENT CALENDAR MONTH: ${firstOfMonth} to ${lastOfMonth}
IMPORTANT: When the user says "this month", they mean the FULL calendar month from ${firstOfMonth} to ${lastOfMonth} (inclusive).

DATA OVERVIEW:
- ${totalBookings} bookings spanning ${dateRange}
- ${customers.length} registered customers (${profiles.filter(p => p.suspended).length} suspended)
- ${nudges.length} nudges total
- ${academyRegs.length} academy registrations
- ${workoutBuddies.length} workout buddy pairs
- ${formerUsers.length} former users
- ${promotions.length} active promotions
- Activities: ${activitiesSummary}
- Clubs: ${clubsSummary}

PRICING (from database):
${pricingStr}

CRITICAL RULES:
1. Revenue can ONLY come from bookings where attendance="show". Bookings without attendance="show" have $0 revenue.
2. Each booking already has a pre-calculated "revenue" field — USE IT as-is.
3. For discount="free", revenue is $0. For discount="50%", revenue is half the club price.

IMPORTANT — DATA RELEVANCE:
- Determine which data source(s) are relevant to the admin's question.
- CUSTOMERS: use CUSTOMERS DATA for user counts, signups, customer lists, etc.
- BOOKINGS/REVENUE: use BOOKINGS DATA for booking counts, revenue, financial reports.
- NUDGES: use NUDGES DATA for nudge counts, statuses, interactions between users.
- ACADEMY: use ACADEMY REGISTRATIONS for enrollment data, academy signups.
- BUDDIES: use WORKOUT BUDDIES for buddy pair data.
- FORMER USERS: use FORMER USERS DATA for churn, departed users.
- PROMOTIONS: use PROMOTIONS DATA for discount/promo usage.
- If the question spans multiple datasets, combine them intelligently.
- Always return ONLY the columns relevant to the question.

CUSTOMERS DATA (${customers.length} registered users):
${customersJson}

BOOKINGS DATA (act=activity slug, act_name=display name, court=court_type, discount=discount_type, attendance=attendance_status, revenue=$ amount):
${bookingsJson}

NUDGES DATA (${nudges.length} nudges — status: pending/accepted/declined):
${nudgesJson}

ACADEMY REGISTRATIONS (${academyRegs.length} registrations — status: pending/contacted/enrolled/declined):
${academyRegsJson}

WORKOUT BUDDIES (${workoutBuddies.length} pairs):
${buddiesJson}

FORMER USERS (${formerUsers.length} departed users):
${formerUsersJson}

PROMOTIONS (${promotions.length} user promotions):
${promotionsJson}

TASK: Answer the admin's question using generate_report. Pick appropriate columns based on what was asked. Sort sensibly.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_report",
              description: "Generate a CSV report with individual booking rows matching the admin's query.",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "Brief 1-3 sentence summary of findings",
                  },
                  csv_headers: {
                    type: "array",
                    items: { type: "string" },
                    description: "Column headers for the CSV",
                  },
                  csv_rows: {
                    type: "array",
                    items: {
                      type: "array",
                      items: { type: "string" },
                    },
                    description: "Array of rows, each row is an array of string values matching headers",
                  },
                },
                required: ["summary", "csv_headers", "csv_rows"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_report" } },
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
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let parsed;

    if (toolCall?.function?.arguments) {
      try {
        parsed = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse tool call arguments:", toolCall.function.arguments);
        throw new Error("AI returned an invalid response. Please try rephrasing your question.");
      }
    } else {
      let content = aiData.choices?.[0]?.message?.content || "";
      content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      console.error("No tool call found, raw content:", content.substring(0, 200));
      if (!content) throw new Error("AI returned an empty response. Please try again.");
      try {
        parsed = JSON.parse(content);
      } catch {
        console.error("Failed to parse fallback content:", content.substring(0, 200));
        throw new Error("AI returned an invalid response. Please try rephrasing your question.");
      }
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
