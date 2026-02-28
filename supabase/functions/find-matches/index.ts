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
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify the caller
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

    const url = new URL(req.url);
    const sportFilter = url.searchParams.get("sport_id");
    const locationFilter = url.searchParams.get("location_id");

    // Get all player selections with joined data (excluding the current user)
    let query = supabase
      .from("player_selections")
      .select(`
        id,
        rank,
        sport_id,
        level_id,
        location_ids,
        user_id
      `)
      .neq("user_id", user.id);

    if (sportFilter) query = query.eq("sport_id", sportFilter);
    if (locationFilter) query = query.contains("location_ids", [locationFilter]);

    const { data: selections, error: selError } = await query;
    if (selError) throw selError;

    if (!selections || selections.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get unique user IDs
    const userIds = [...new Set(selections.map((s: any) => s.user_id))];

    // Fetch profiles, offerings, levels, locations in parallel
    const [profilesRes, offeringsRes, levelsRes, locationsRes, mySelectionsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
      supabase.from("offerings").select("id, name, slug, brand_color"),
      supabase.from("player_levels").select("id, label, display_order"),
      supabase.from("club_locations").select("id, name, location"),
      supabase.from("player_selections").select("sport_id, level_id, location_ids").eq("user_id", user.id),
    ]);

    const profileMap = Object.fromEntries((profilesRes.data || []).map((p: any) => [p.user_id, p]));
    const offeringMap = Object.fromEntries((offeringsRes.data || []).map((o: any) => [o.id, o]));
    const levelMap = Object.fromEntries((levelsRes.data || []).map((l: any) => [l.id, l]));
    const locationMap = Object.fromEntries((locationsRes.data || []).map((l: any) => [l.id, l]));
    const mySelections = mySelectionsRes.data || [];

    // Group selections by user
    const userSelectionsMap: Record<string, any[]> = {};
    for (const sel of selections) {
      if (!userSelectionsMap[sel.user_id]) userSelectionsMap[sel.user_id] = [];
      userSelectionsMap[sel.user_id].push(sel);
    }

    // Build match profiles with compatibility scoring
    const matches = userIds.map((uid: string) => {
      const profile = profileMap[uid];
      const userSels = userSelectionsMap[uid] || [];
      const fullName = profile?.full_name || "Anonymous";

      // Privacy: show first name + last initial
      const nameParts = fullName.trim().split(" ");
      const displayName = nameParts.length > 1
        ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
        : nameParts[0];

      const sports = userSels.map((s: any) => {
        const offering = offeringMap[s.sport_id];
        const level = levelMap[s.level_id];
        const locIds: string[] = s.location_ids || [];
        const locNames = locIds.map((lid: string) => locationMap[lid]).filter(Boolean);

        // Compute match quality for this sport
        const mySel = mySelections.find((ms: any) => ms.sport_id === s.sport_id);
        let matchQuality: "perfect" | "good" | "sport-only" = "sport-only";
        if (mySel) {
          const myLocIds: string[] = mySel.location_ids || [];
          const hasOverlap = myLocIds.some((id: string) => locIds.includes(id));
          if (mySel.level_id === s.level_id && hasOverlap) {
            matchQuality = "perfect";
          } else if (mySel.level_id === s.level_id) {
            matchQuality = "good";
          }
        }

        return {
          sport_id: s.sport_id,
          sport_name: offering?.name || "Unknown",
          sport_slug: offering?.slug || "",
          brand_color: offering?.brand_color || null,
          level_label: level?.label || "Unknown",
          level_order: level?.display_order || 0,
          location_name: locNames.length > 0 ? locNames.map((l: any) => l.name).join(", ") : null,
          location_area: locNames.length > 0 ? locNames.map((l: any) => l.location).join(", ") : null,
          match_quality: matchQuality,
        };
      });

      // Overall compatibility score
      const bestMatch = sports.reduce(
        (best: string, s: any) => {
          if (s.match_quality === "perfect") return "perfect";
          if (s.match_quality === "good" && best !== "perfect") return "good";
          return best;
        },
        "sport-only"
      );

      return {
        user_id: uid,
        display_name: displayName,
        sports,
        best_match: bestMatch,
      };
    });

    // Sort: perfect matches first, then good, then sport-only
    const order = { perfect: 0, good: 1, "sport-only": 2 };
    matches.sort((a: any, b: any) => (order[a.best_match as keyof typeof order] ?? 2) - (order[b.best_match as keyof typeof order] ?? 2));

    return new Response(JSON.stringify({ matches, offerings: offeringsRes.data, locations: locationsRes.data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
