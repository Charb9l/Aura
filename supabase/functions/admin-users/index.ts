import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const adminClient = createClient(supabaseUrl, serviceKey);

  // Validate the caller's JWT using the admin client (bypasses RLS)
  const token = authHeader.replace("Bearer ", "");
  const { data: { user: caller }, error: userError } = await adminClient.auth.getUser(token);
  if (userError || !caller) return null;

  const { data: roleData, error: roleError } = await adminClient
    .from("user_roles")
    .select("user_id")
    .eq("user_id", caller.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError || !roleData) return null;

  return adminClient;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminClient = await verifyAdmin(req);
    if (!adminClient) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    let action = url.searchParams.get("action");
    let body: Record<string, unknown> = {};

    try {
      body = await req.json();
      if (!action && body?.action) action = body.action as string;
    } catch { /* no body */ }

    // LIST users or admins
    if (action === "list" || action === "list-admins") {
      const { data: { users }, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let adminRoles: { user_id: string; club_id: string | null }[] = [];
      if (action === "list-admins") {
        const { data: roles } = await adminClient
          .from("user_roles")
          .select("user_id, club_id")
          .eq("role", "admin");
        adminRoles = roles || [];
      }
      const adminUserIds = action === "list-admins"
        ? new Set(adminRoles.map(r => r.user_id))
        : null;
      const adminClubMap = new Map(adminRoles.map(r => [r.user_id, r.club_id]));

      const { data: profiles } = await adminClient
        .from("profiles")
        .select("user_id, full_name, phone, created_at");

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      let combined = users.map(u => ({
        user_id: u.id,
        email: u.email || "",
        full_name: profileMap.get(u.id)?.full_name || u.user_metadata?.full_name || "",
        phone: profileMap.get(u.id)?.phone || u.user_metadata?.phone || "",
        created_at: profileMap.get(u.id)?.created_at || u.created_at,
        club_id: adminClubMap.get(u.id) || null,
      }));

      if (adminUserIds) {
        combined = combined.filter(u => adminUserIds!.has(u.user_id));
      }

      return new Response(JSON.stringify({ users: combined }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET current admin's club_id
    if (action === "my-club") {
      const authHeader = req.headers.get("Authorization")!;
      const token = authHeader.replace("Bearer ", "");
      const { data: { user: caller } } = await adminClient.auth.getUser(token);
      if (!caller) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: role, error: roleError } = await adminClient
        .from("user_roles")
        .select("club_id")
        .eq("user_id", caller.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError) {
        return new Response(JSON.stringify({ error: roleError.message }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ club_id: role?.club_id || null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // LIST former users
    if (action === "list-former") {
      const userType = (body.user_type as string) || "all";
      let query = adminClient.from("former_users").select("*").order("ended_at", { ascending: false });
      if (userType !== "all") {
        query = query.eq("user_type", userType);
      }
      const { data, error } = await query;
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ former_users: data || [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE user
    if (action === "update") {
      const { user_id, email, phone, password, club_id, full_name, user_type } = body as Record<string, string | null>;

      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If updating an admin, log old details to former_users before changing
      const isAdminUpdate = user_type === "admin";
      if (isAdminUpdate && (email || phone || full_name)) {
        // Fetch current details
        const { data: { users: currentUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1 });
        const { data: currentUser } = await adminClient.auth.admin.getUserById(user_id as string);
        const { data: currentProfile } = await adminClient
          .from("profiles")
          .select("full_name, phone, created_at")
          .eq("user_id", user_id)
          .maybeSingle();
        const { data: currentRole } = await adminClient
          .from("user_roles")
          .select("club_id")
          .eq("user_id", user_id)
          .eq("role", "admin")
          .maybeSingle();

        // Get club name for historical record
        let clubName: string | null = null;
        if (currentRole?.club_id) {
          const { data: club } = await adminClient
            .from("clubs")
            .select("name")
            .eq("id", currentRole.club_id)
            .maybeSingle();
          clubName = club?.name || null;
        }

        await adminClient.from("former_users").insert({
          user_id: user_id as string,
          full_name: currentProfile?.full_name || currentUser?.user?.user_metadata?.full_name || null,
          email: currentUser?.user?.email || "",
          phone: currentProfile?.phone || null,
          user_type: "admin",
          club_id: currentRole?.club_id || null,
          club_name: clubName,
          started_at: currentProfile?.created_at || null,
          reason: "edited",
        });
      }

      // Update auth user (email and/or password)
      const authUpdate: Record<string, string> = {};
      if (email) authUpdate.email = email;
      if (password) authUpdate.password = password;

      if (Object.keys(authUpdate).length > 0) {
        const { error: authError } = await adminClient.auth.admin.updateUserById(user_id as string, authUpdate);
        if (authError) {
          return new Response(JSON.stringify({ error: authError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Update profile (phone and/or full_name)
      const profileUpdate: Record<string, string> = {};
      if (phone !== undefined && phone !== null) profileUpdate.phone = phone;
      if (full_name !== undefined && full_name !== null) profileUpdate.full_name = full_name;
      if (Object.keys(profileUpdate).length > 0) {
        await adminClient.from("profiles").update(profileUpdate).eq("user_id", user_id);
      }

      // Update club assignment if provided
      if (club_id !== undefined) {
        await adminClient
          .from("user_roles")
          .update({ club_id: club_id || null })
          .eq("user_id", user_id)
          .eq("role", "admin");
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE admin (remove role + delete auth user)
    if (action === "delete-admin") {
      const { user_id } = body as Record<string, string>;

      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Log to former_users before deleting
      const { data: currentUser } = await adminClient.auth.admin.getUserById(user_id);
      const { data: currentProfile } = await adminClient
        .from("profiles")
        .select("full_name, phone, created_at")
        .eq("user_id", user_id)
        .maybeSingle();
      const { data: currentRole } = await adminClient
        .from("user_roles")
        .select("club_id")
        .eq("user_id", user_id)
        .eq("role", "admin")
        .maybeSingle();

      let clubName: string | null = null;
      if (currentRole?.club_id) {
        const { data: club } = await adminClient
          .from("clubs")
          .select("name")
          .eq("id", currentRole.club_id)
          .maybeSingle();
        clubName = club?.name || null;
      }

      await adminClient.from("former_users").insert({
        user_id,
        full_name: currentProfile?.full_name || currentUser?.user?.user_metadata?.full_name || null,
        email: currentUser?.user?.email || "",
        phone: currentProfile?.phone || null,
        user_type: "admin",
        club_id: currentRole?.club_id || null,
        club_name: clubName,
        started_at: currentProfile?.created_at || null,
        reason: "deleted",
      });

      // Remove admin role
      await adminClient
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("role", "admin");

      // Delete the auth user entirely
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
