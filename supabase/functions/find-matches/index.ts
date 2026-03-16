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
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const user = { id: userId };

    const supabase = createClient(supabaseUrl, serviceKey);

    const url = new URL(req.url);
    const sportFilter = url.searchParams.get("sport_id");
    const locationFilter = url.searchParams.get("location_id");

    let query = supabase
      .from("player_selections")
      .select("id, rank, sport_id, level_id, location_ids, user_id, playstyle, availability, goals, years_experience")
      .neq("user_id", user.id);

    if (sportFilter) query = query.eq("sport_id", sportFilter);
    if (locationFilter) query = query.contains("location_ids", [locationFilter]);

    const { data: selections, error: selError } = await query;
    if (selError) throw selError;

    if (!selections || selections.length === 0) {
      // Still return offerings and filtered locations even with no matches
      const [offeringsRes, clubsRes, clubLocsRes] = await Promise.all([
        supabase.from("offerings").select("id, name, slug, brand_color"),
        supabase.from("clubs").select("id, offerings, published").eq("published", true),
        supabase.from("club_locations").select("id, name, location, activity, club_id"),
      ]);

      // Filter locations by sport if sport filter is applied
      let filteredLocations = clubLocsRes.data || [];
      if (sportFilter) {
        const offering = (offeringsRes.data || []).find((o: any) => o.id === sportFilter);
        if (offering) {
          const publishedClubIds = new Set((clubsRes.data || [])
            .filter((c: any) => c.offerings.some((o: string) => o.toLowerCase().includes(offering.slug.toLowerCase())))
            .map((c: any) => c.id));
          filteredLocations = filteredLocations.filter((loc: any) => publishedClubIds.has(loc.club_id));
        }
      }

      return new Response(JSON.stringify({ matches: [], offerings: offeringsRes.data, locations: filteredLocations }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = [...new Set(selections.map((s: any) => s.user_id))];

    const [profilesRes, offeringsRes, levelsRes, locationsRes, mySelectionsRes, clubsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, suspended").in("user_id", userIds),
      supabase.from("offerings").select("id, name, slug, brand_color"),
      supabase.from("player_levels").select("id, label, display_order"),
      supabase.from("club_locations").select("id, name, location, activity, club_id"),
      supabase.from("player_selections").select("sport_id, level_id, location_ids, playstyle, availability, goals").eq("user_id", user.id),
      supabase.from("clubs").select("id, offerings, published").eq("published", true),
    ]);

    const profileMap = Object.fromEntries((profilesRes.data || []).map((p: any) => [p.user_id, p]));
    const offeringMap = Object.fromEntries((offeringsRes.data || []).map((o: any) => [o.id, o]));

    // Filter out suspended users
    const suspendedIds = new Set((profilesRes.data || []).filter((p: any) => p.suspended).map((p: any) => p.user_id));
    const activeUserIds = userIds.filter((uid: string) => !suspendedIds.has(uid));
    const levelMap = Object.fromEntries((levelsRes.data || []).map((l: any) => [l.id, l]));
    const locationMap = Object.fromEntries((locationsRes.data || []).map((l: any) => [l.id, l]));
    const mySelections = mySelectionsRes.data || [];

    // Filter locations: only show locations from published clubs that have the selected activity
    let filteredLocations = locationsRes.data || [];
    if (sportFilter) {
      const offering = offeringMap[sportFilter];
      if (offering) {
        const publishedClubIds = new Set((clubsRes.data || [])
          .filter((c: any) => c.offerings.some((o: string) => o.toLowerCase().includes(offering.slug.toLowerCase())))
          .map((c: any) => c.id));
        filteredLocations = filteredLocations.filter((loc: any) => publishedClubIds.has(loc.club_id));
      }
    }

    const userSelectionsMap: Record<string, any[]> = {};
    for (const sel of selections) {
      if (!userSelectionsMap[sel.user_id]) userSelectionsMap[sel.user_id] = [];
      userSelectionsMap[sel.user_id].push(sel);
    }

    // Scoring helper
    const scoreSport = (theirs: any, mine: any) => {
      let score = 0;
      const details: string[] = [];

      if (mine.level_id === theirs.level_id) { score += 3; details.push("level"); }
      if (mine.playstyle && theirs.playstyle && mine.playstyle === theirs.playstyle) { score += 2; details.push("playstyle"); }

      const myLocs: string[] = mine.location_ids || [];
      const theirLocs: string[] = theirs.location_ids || [];
      if (myLocs.length > 0 && theirLocs.length > 0 && myLocs.some((id: string) => theirLocs.includes(id))) { score += 2; details.push("location"); }

      const myAvail: any[] = mine.availability || [];
      const theirAvail: any[] = theirs.availability || [];
      const hasAvailOverlap = myAvail.some((ma: any) => theirAvail.some((ta: any) => ma.day === ta.day && ma.period === ta.period));
      if (myAvail.length > 0 && theirAvail.length > 0 && hasAvailOverlap) { score += 2; details.push("availability"); }

      const myGoals: string[] = mine.goals || [];
      const theirGoals: string[] = theirs.goals || [];
      if (myGoals.filter((g: string) => theirGoals.includes(g)).length > 0) { score += 1; details.push("goals"); }

      let matchQuality: "perfect" | "good" | "sport-only" = "sport-only";
      if (score >= 7) matchQuality = "perfect";
      else if (score >= 3) matchQuality = "good";

      return { score, matchQuality, details };
    };

    const matches = userIds.map((uid: string) => {
      const profile = profileMap[uid];
      const userSels = userSelectionsMap[uid] || [];
      const fullName = profile?.full_name || "Anonymous";
      const nameParts = fullName.trim().split(" ");
      const displayName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.` : nameParts[0];

      let bestScore = 0;

      const sports = userSels.map((s: any) => {
        const offering = offeringMap[s.sport_id];
        const level = levelMap[s.level_id];
        const locIds: string[] = s.location_ids || [];
        const locNames = locIds.map((lid: string) => locationMap[lid]).filter(Boolean);

        const mySel = mySelections.find((ms: any) => ms.sport_id === s.sport_id);
        let matchQuality: "perfect" | "good" | "sport-only" = "sport-only";
        let score = 0;
        let matchDetails: string[] = [];

        if (mySel) {
          const result = scoreSport(s, mySel);
          matchQuality = result.matchQuality;
          score = result.score;
          matchDetails = result.details;
        }

        if (score > bestScore) bestScore = score;

        return {
          sport_id: s.sport_id,
          sport_name: offering?.name || "Unknown",
          sport_slug: offering?.slug || "",
          brand_color: offering?.brand_color || null,
          level_label: level?.label || "Unknown",
          level_order: level?.display_order || 0,
          playstyle: s.playstyle || null,
          location_name: locNames.length > 0 ? locNames.map((l: any) => l.name).join(", ") : null,
          location_area: locNames.length > 0 ? locNames.map((l: any) => l.location).join(", ") : null,
          match_quality: matchQuality,
          match_details: matchDetails,
        };
      });

      const bestMatch = bestScore >= 7 ? "perfect" : bestScore >= 3 ? "good" : "sport-only";

      return {
        user_id: uid,
        display_name: displayName,
        sports,
        best_match: bestMatch,
        match_score: bestScore,
      };
    });

    matches.sort((a: any, b: any) => b.match_score - a.match_score);

    return new Response(JSON.stringify({ matches, offerings: offeringsRes.data, locations: filteredLocations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
