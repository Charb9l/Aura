import { useMemo } from "react";
import { startOfWeek, subWeeks, format, parseISO, differenceInDays } from "date-fns";

interface BookingLike {
  attendance_status?: string | null;
  booking_time: string;
  activity: string;
  booking_date: string;
}

export const useBadgeLevels = (bookings: BookingLike[]) => {
  const completedBookings = useMemo(() =>
    bookings.filter(b => b.attendance_status === "show"), [bookings]);

  const uniqueActivities = useMemo(() =>
    new Set(completedBookings.map(b => b.activity)).size, [completedBookings]);

  const streakData = useMemo(() => {
    if (!completedBookings.length) return { currentStreak: 0, longestStreak: 0 };
    const weekSet = new Set<string>();
    completedBookings.forEach(b => {
      const ws = startOfWeek(parseISO(b.booking_date), { weekStartsOn: 1 });
      weekSet.add(format(ws, "yyyy-MM-dd"));
    });
    const sortedWeeks = Array.from(weekSet).sort().reverse();
    let current = 0;
    const thisWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const lastWeek = format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), "yyyy-MM-dd");
    if (sortedWeeks[0] === thisWeek || sortedWeeks[0] === lastWeek) {
      for (let i = 0; i < sortedWeeks.length; i++) {
        const expected = format(startOfWeek(subWeeks(new Date(), sortedWeeks[0] === thisWeek ? i : i + 1), { weekStartsOn: 1 }), "yyyy-MM-dd");
        if (sortedWeeks[i] === expected) current++;
        else break;
      }
    }
    const ascending = Array.from(weekSet).sort();
    let longest = 1, run = 1;
    for (let i = 1; i < ascending.length; i++) {
      const diff = differenceInDays(parseISO(ascending[i]), parseISO(ascending[i - 1]));
      if (diff === 7) { run++; longest = Math.max(longest, run); } else run = 1;
    }
    if (ascending.length <= 1) longest = ascending.length;
    return { currentStreak: current, longestStreak: Math.max(longest, current) };
  }, [completedBookings]);

  const morningCount = completedBookings.filter(b => { const h = parseInt(b.booking_time); return h >= 6 && h < 12; }).length;
  const eveningCount = completedBookings.filter(b => { const h = parseInt(b.booking_time); return h >= 17; }).length;
  const afternoonCount = completedBookings.filter(b => { const h = parseInt(b.booking_time); return h >= 12 && h < 17; }).length;

  const wellness = useMemo(() => {
    if (!completedBookings.length) return 0;
    const c = Math.min(streakData.currentStreak * 10, 40);
    const v = Math.min(uniqueActivities * 10, 30);
    const f = Math.min(completedBookings.length * 2, 30);
    return Math.min(c + v + f, 100);
  }, [streakData.currentStreak, uniqueActivities, completedBookings]);

  const completedLevelCount = useMemo(() => {
    const n = completedBookings.length;
    const u = uniqueActivities;
    const ls = streakData.longestStreak;
    const m = morningCount;
    const e = eveningCount;
    const a = afternoonCount;
    const ws = wellness;
    const l1 = [n>=1, n>=3, u>=2, m>=3, e>=3, ls>=2, n>=5, ws>=30].every(Boolean);
    const l2 = [n>=10, u>=3, ls>=4, m>=5, e>=5, n>=20, a>=5, ws>=60].every(Boolean);
    const l3 = [n>=50, u>=5, ls>=8, m>=10, e>=10, n>=100, ls>=12, ws>=100].every(Boolean);
    return (l1 ? 1 : 0) + (l2 ? 1 : 0) + (l3 ? 1 : 0);
  }, [completedBookings, uniqueActivities, streakData, morningCount, eveningCount, afternoonCount, wellness]);

  return { completedLevelCount };
};
