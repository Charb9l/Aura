import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { findMatchingClubForBooking } from "@/lib/loyalty-club-match";

export interface ClubReward {
  clubId: string;
  clubName: string;
  clubLogo: string | null;
  points: number;
  reward: "50%" | "free" | null;
}

export const useRewards = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [badgePoints, setBadgePoints] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setLoaded(true); return; }

    const fetch = async () => {
      const [bRes, cRes, aRes, bpRes] = await Promise.all([
        supabase.from("bookings").select("activity, activity_name, attendance_status").eq("user_id", user.id),
        supabase.from("clubs").select("id, name, logo_url, offerings, published").order("name"),
        supabase.from("loyalty_point_adjustments").select("club_id, points").eq("user_id", user.id),
        supabase.from("badge_point_assignments").select("club_id").eq("user_id", user.id),
      ]);

      setBookings(bRes.data || []);
      setClubs((cRes.data || []).filter((c: any) => c.published !== false));

      const adjMap: Record<string, number> = {};
      ((aRes.data || []) as any[]).forEach(a => {
        adjMap[a.club_id] = (adjMap[a.club_id] || 0) + a.points;
      });
      setAdjustments(adjMap);

      const bpMap: Record<string, number> = {};
      ((bpRes.data || []) as any[]).forEach(a => {
        bpMap[a.club_id] = (bpMap[a.club_id] || 0) + 1;
      });
      setBadgePoints(bpMap);
      setLoaded(true);
    };
    fetch();
  }, [user]);

  const rewards = useMemo<ClubReward[]>(() => {
    if (!loaded || clubs.length === 0) return [];

    const clubPts: Record<string, number> = {};
    clubs.forEach(c => { clubPts[c.id] = 0; });

    bookings.forEach(b => {
      if (b.attendance_status !== "show" && b.attendance_status !== "no_show") return;
      const club = findMatchingClubForBooking(clubs, { activity: b.activity, activity_name: b.activity_name });
      if (!club) return;
      if (b.attendance_status === "show") clubPts[club.id] += 1;
      if (b.attendance_status === "no_show") clubPts[club.id] -= 1;
    });

    return clubs.map(club => {
      const raw = (clubPts[club.id] || 0) + (badgePoints[club.id] || 0) + (adjustments[club.id] || 0);
      // Cap at 10 — points don't reset after completing the loyalty track
      const total = Math.min(10, Math.max(0, raw));
      let reward: "50%" | "free" | null = null;
      // At exactly 5 the NEXT booking gets 50% off
      // At exactly 10 the NEXT booking is free
      if (total === 10) reward = "free";
      else if (total >= 5) reward = "50%";

      return {
        clubId: club.id,
        clubName: club.name,
        clubLogo: club.logo_url,
        points: total,
        reward,
      };
    });
  }, [loaded, bookings, clubs, adjustments, badgePoints]);

  const activeRewards = useMemo(() => rewards.filter(r => r.reward !== null), [rewards]);
  const hasRewards = activeRewards.length > 0;

  const getRewardForClub = (clubId: string): ClubReward | undefined =>
    activeRewards.find(r => r.clubId === clubId);

  return { rewards, activeRewards, hasRewards, getRewardForClub, loaded };
};
