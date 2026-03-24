import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Authenticate: require valid JWT with admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const todayStr = now.toISOString().split("T")[0];

    // 1. Daily Report: bookings from last 24 hours
    const { data: bookings } = await admin
      .from("bookings")
      .select("*")
      .gte("booking_date", yesterdayStr)
      .lte("booking_date", todayStr)
      .order("booking_date", { ascending: false });

    const allBookings = bookings || [];
    const showBookings = allBookings.filter((b: any) => b.attendance_status === "show");
    
    // Get prices for revenue calc
    const { data: prices } = await admin.from("club_activity_prices").select("*");
    const priceMap: Record<string, number> = {};
    (prices || []).forEach((p: any) => {
      const key = p.price_label ? `${p.activity_slug}:${p.price_label}` : p.activity_slug;
      if (!(key in priceMap)) priceMap[key] = Number(p.price);
    });

    const calcRevenue = (b: any) => {
      let base = 0;
      if (b.activity === "basketball" && b.court_type) {
        base = priceMap[`${b.activity}:${b.court_type}`] ?? 0;
      } else {
        base = priceMap[b.activity] ?? 0;
      }
      if (b.discount_type === "free") return 0;
      if (b.discount_type === "50%") return base * 0.5;
      return base;
    };

    const totalRevenue = showBookings.reduce((sum: number, b: any) => sum + calcRevenue(b), 0);

    // Build CSV
    const csvHeaders = ["date", "time", "activity", "customer", "email", "phone", "status", "attendance", "revenue"];
    const csvRows = allBookings.map((b: any) => [
      b.booking_date,
      b.booking_time,
      b.activity_name,
      b.full_name,
      b.email,
      b.phone,
      b.status,
      b.attendance_status || "pending",
      b.attendance_status === "show" ? `$${calcRevenue(b)}` : "$0",
    ]);
    const csvData = [csvHeaders.join(","), ...csvRows.map((r: string[]) => r.map(v => `"${(v || "").replace(/"/g, '""')}"`).join(","))].join("\n");

    const summaryBody = `Daily Summary for ${yesterdayStr} to ${todayStr}:\n• Total bookings: ${allBookings.length}\n• Confirmed shows: ${showBookings.length}\n• Revenue from shows: $${totalRevenue.toLocaleString()}\n\nDownload the attached CSV for full details.`;

    await admin.from("admin_notifications").insert({
      type: "daily_report",
      title: `Daily Report — ${allBookings.length} bookings, $${totalRevenue} revenue`,
      body: summaryBody,
      metadata: { csv_data: csvData, total_bookings: allBookings.length, total_revenue: totalRevenue },
    });

    // 2. Unmarked bookings: past bookings with no attendance_status
    const { data: unmarked } = await admin
      .from("bookings")
      .select("*")
      .lt("booking_date", todayStr)
      .is("attendance_status", null)
      .eq("status", "confirmed");

    if (unmarked && unmarked.length > 0) {
      const names = unmarked.slice(0, 5).map((b: any) => `${b.full_name} (${b.booking_date} ${b.booking_time})`).join("\n• ");
      const moreText = unmarked.length > 5 ? `\n...and ${unmarked.length - 5} more` : "";

      await admin.from("admin_notifications").insert({
        type: "unmarked_booking",
        title: `${unmarked.length} booking${unmarked.length > 1 ? "s" : ""} not marked as Show/No Show`,
        body: `The following past bookings still need attendance marking:\n• ${names}${moreText}`,
        metadata: { count: unmarked.length, booking_ids: unmarked.map((b: any) => b.id) },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("daily-report error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
