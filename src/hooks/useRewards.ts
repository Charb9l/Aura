import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { findMatchingClubForBooking } from "@/lib/loyalty-club-match";
import { getISOWeek, getISOWeekYear, parseISO } from "date-fns";

export interface ClubReward {
  clubId: string;
  clubName: string;
  clubLogo: string | null;
  points: number;
  reward: "50%" | "free" | null;
}

/** Returns ISO week key like "2025-W03" */
const weekKey = (dateStr: string): string => {
  const d = parseISO(dateStr);
  const w = getISOWeek(d);
  const y = getISOWeekYear(d);
  return `${y}-W${String(w).padStart(2, "0")}`;
};

/** Check if two week keys are consecutive (e.g. 2025-W03 → 2025-W04) */
const areConsecutiveWeeks = (a: string, b: string): boolean => {
  const [yA, wA] = a.split("-W").map(Number);
  const [yB, wB] = b.split("-W").map(Number);
  if (yA === yB) return wB === wA + 1;
  // Handle year boundary: last week of year → week 1 of next year
  if (yB === yA + 1 && wB === 1) {
    // ISO weeks can be 52 or 53
    const lastWeekOfYearA = getISOWeek(new Date(yA, 11, 28));
    return wA === lastWeekOfYearA;
  }
  return false;
};

/**
 * Calculate streak bonus points per club.
 * Rule: 3 consecutive weeks with at least one "show" booking →
 * the FIRST show booking in week 3 earns +1 extra point.
 * Then the streak resets (week 4 = new week 1).
 */
const calcStreakBonus = (
  bookings: any[],
  clubs: any[],
): Record<string, number> => {
  // Group show booking dates by club
  const clubDates: Record<string, string[]> = {};

  bookings.forEach(b => {
    if (b.attendance_status !== "show" || !b.booking_date) return;
    const club = findMatchingClubForBooking(clubs, {
      activity: b.activity,
      activity_name: b.activity_name,
    });
    if (!club) return;
    if (!clubDates[club.id]) clubDates[club.id] = [];
    clubDates[club.id].push(b.booking_date);
  });

  const bonusMap: Record<string, number> = {};

  Object.entries(clubDates).forEach(([clubId, dates]) => {
    // Get unique sorted weeks
    const weeks = Array.from(new Set(dates.map(weekKey))).sort();
    if (weeks.length < 3) return;

    let streak = 1;
    let bonus = 0;

    for (let i = 1; i < weeks.length; i++) {
      if (areConsecutiveWeeks(weeks[i - 1], weeks[i])) {
        streak++;
        if (streak === 3) {
          bonus++; // +1 extra point for one booking in week 3
          streak = 0; // full reset — next week starts fresh
        }
      } else {
        streak = 1;
      }
    }

    if (bonus > 0) bonusMap[clubId] = bonus;
  });

  return bonusMap;
};

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
        supabase.from("bookings").select("activity, activity_name, attendance_status, booking_date").eq("user_id", user.id),
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

    // Calculate streak bonuses (+1 extra per completed 3-week streak)
    const streakBonus = calcStreakBonus(bookings, clubs);

    return clubs.map(club => {
      const raw = (clubPts[club.id] || 0)
        + (badgePoints[club.id] || 0)
        + (adjustments[club.id] || 0)
        + (streakBonus[club.id] || 0);
      const total = Math.min(10, Math.max(0, raw));
      let reward: "50%" | "free" | null = null;
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
