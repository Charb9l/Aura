import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Nudge {
  id: string;
  sender_id: string;
  receiver_id: string;
  sport_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  responded_at: string | null;
  // Joined data
  sender_name?: string;
  receiver_name?: string;
  sender_avatar?: string;
  receiver_avatar?: string;
  sport_name?: string;
  sport_slug?: string;
  sport_brand_color?: string | null;
  sender_level?: string;
  receiver_level?: string;
  sender_playstyle?: string | null;
  receiver_playstyle?: string | null;
  sender_phone?: string | null;
  receiver_phone?: string | null;
}

export interface WorkoutBuddy {
  id: string;
  user_id_1: string;
  user_id_2: string;
  sport_id: string;
  created_at: string;
  buddy_name?: string;
  buddy_avatar?: string;
  buddy_phone?: string | null;
  sport_name?: string;
  sport_slug?: string;
  sport_brand_color?: string | null;
}

export const useNudges = () => {
  const { user } = useAuth();
  const [sentNudges, setSentNudges] = useState<Nudge[]>([]);
  const [receivedNudges, setReceivedNudges] = useState<Nudge[]>([]);
  const [buddies, setBuddies] = useState<WorkoutBuddy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNudges = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Fetch raw nudges
    const [sentRes, recvRes, buddiesRes] = await Promise.all([
      supabase.from("nudges").select("*").eq("sender_id", user.id).eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("nudges").select("*").eq("receiver_id", user.id).eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("workout_buddies").select("*").or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`).order("created_at", { ascending: false }),
    ]);

    const rawSent = (sentRes.data || []) as any[];
    const rawRecv = (recvRes.data || []) as any[];
    const rawBuddies = (buddiesRes.data || []) as any[];

    // Collect all user IDs and sport IDs we need
    const userIds = new Set<string>();
    const sportIds = new Set<string>();
    [...rawSent, ...rawRecv].forEach(n => {
      userIds.add(n.sender_id);
      userIds.add(n.receiver_id);
      sportIds.add(n.sport_id);
    });
    rawBuddies.forEach(b => {
      userIds.add(b.user_id_1);
      userIds.add(b.user_id_2);
      sportIds.add(b.sport_id);
    });

    const uniqueUserIds = [...userIds];
    const uniqueSportIds = [...sportIds];

    // Fetch profiles, offerings, and player_selections
    const [profilesRes, offeringsRes, selectionsRes] = await Promise.all([
      uniqueUserIds.length > 0 ? supabase.from("profiles").select("user_id, full_name, avatar_url, phone").in("user_id", uniqueUserIds) : { data: [] },
      uniqueSportIds.length > 0 ? supabase.from("offerings").select("id, name, slug, brand_color").in("id", uniqueSportIds) : { data: [] },
      uniqueUserIds.length > 0 && uniqueSportIds.length > 0
        ? supabase.from("player_selections").select("user_id, sport_id, level_id, playstyle").in("user_id", uniqueUserIds).in("sport_id", uniqueSportIds)
        : { data: [] },
    ]);

    const profileMap: Record<string, any> = {};
    (profilesRes.data || []).forEach((p: any) => { profileMap[p.user_id] = p; });
    const offeringMap: Record<string, any> = {};
    (offeringsRes.data || []).forEach((o: any) => { offeringMap[o.id] = o; });
    
    // Fetch level labels
    const levelIds = new Set<string>();
    (selectionsRes.data || []).forEach((s: any) => { if (s.level_id) levelIds.add(s.level_id); });
    let levelMap: Record<string, string> = {};
    if (levelIds.size > 0) {
      const { data: levels } = await supabase.from("player_levels").select("id, label").in("id", [...levelIds]);
      (levels || []).forEach((l: any) => { levelMap[l.id] = l.label; });
    }

    const selectionMap: Record<string, any> = {};
    (selectionsRes.data || []).forEach((s: any) => { selectionMap[`${s.user_id}__${s.sport_id}`] = s; });

    const enrichNudge = (n: any): Nudge => {
      const sport = offeringMap[n.sport_id];
      const senderProfile = profileMap[n.sender_id];
      const receiverProfile = profileMap[n.receiver_id];
      const senderSel = selectionMap[`${n.sender_id}__${n.sport_id}`];
      const receiverSel = selectionMap[`${n.receiver_id}__${n.sport_id}`];
      return {
        ...n,
        sender_name: senderProfile?.full_name || "Anonymous",
        receiver_name: receiverProfile?.full_name || "Anonymous",
        sender_avatar: senderProfile?.avatar_url || null,
        receiver_avatar: receiverProfile?.avatar_url || null,
        sender_phone: senderProfile?.phone || null,
        receiver_phone: receiverProfile?.phone || null,
        sport_name: sport?.name || "Unknown",
        sport_slug: sport?.slug || "",
        sport_brand_color: sport?.brand_color || null,
        sender_level: senderSel ? (levelMap[senderSel.level_id] || "") : "",
        receiver_level: receiverSel ? (levelMap[receiverSel.level_id] || "") : "",
        sender_playstyle: senderSel?.playstyle || null,
        receiver_playstyle: receiverSel?.playstyle || null,
      };
    };

    setSentNudges(rawSent.map(enrichNudge));
    setReceivedNudges(rawRecv.map(enrichNudge));

    // Enrich buddies
    const enrichedBuddies: WorkoutBuddy[] = rawBuddies.map((b: any) => {
      const buddyId = b.user_id_1 === user.id ? b.user_id_2 : b.user_id_1;
      const buddyProfile = profileMap[buddyId];
      const sport = offeringMap[b.sport_id];
      return {
        ...b,
        buddy_name: buddyProfile?.full_name || "Anonymous",
        buddy_avatar: buddyProfile?.avatar_url || null,
        buddy_phone: buddyProfile?.phone || null,
        sport_name: sport?.name || "Unknown",
        sport_slug: sport?.slug || "",
        sport_brand_color: sport?.brand_color || null,
      };
    });
    setBuddies(enrichedBuddies);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchNudges(); }, [fetchNudges]);

  const sendNudge = async (receiverId: string, sportId: string) => {
    if (!user) return false;
    const { error } = await supabase.from("nudges").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      sport_id: sportId,
    } as any);
    if (error) return false;

    // Send nudge email notification
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "rzibwsrbizlsztmeznnr";
      const session = (await supabase.auth.getSession()).data.session;
      await fetch(`https://${projectId}.supabase.co/functions/v1/nudge-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiver_id: receiverId, sport_id: sportId }),
      });
    } catch {}

    await fetchNudges();
    return true;
  };

  const respondToNudge = async (nudgeId: string, accept: boolean) => {
    if (!user) return false;
    const nudge = receivedNudges.find(n => n.id === nudgeId);
    if (!nudge) return false;

    const { error } = await supabase.from("nudges").update({
      status: accept ? "accepted" : "declined",
      responded_at: new Date().toISOString(),
    } as any).eq("id", nudgeId);
    if (error) return false;

    if (accept) {
      // Create workout buddy record (ordered IDs)
      const [id1, id2] = [nudge.sender_id, user.id].sort();
      await supabase.from("workout_buddies").insert({
        user_id_1: id1,
        user_id_2: id2,
        sport_id: nudge.sport_id,
        nudge_id: nudgeId,
      } as any);
    }

    await fetchNudges();
    return true;
  };

  const pendingReceivedCount = receivedNudges.length;

  return {
    sentNudges,
    receivedNudges,
    buddies,
    loading,
    sendNudge,
    respondToNudge,
    refetch: fetchNudges,
    pendingReceivedCount,
  };
};

export const usePendingNudgeCount = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) { setCount(0); return; }
    supabase
      .from("nudges")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .then(({ count: c }) => setCount(c || 0));
  }, [user]);

  return count;
};
