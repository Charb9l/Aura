import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Star, Target, Sun, Moon, Flame, TrendingUp, Sparkles, Trophy, Clock, Shield, Award, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, subWeeks, format, parseISO, differenceInDays } from "date-fns";

const ICON_MAP: Record<string, React.ReactNode> = {
  star: <Star className="h-5 w-5" />,
  zap: <Zap className="h-5 w-5" />,
  target: <Target className="h-5 w-5" />,
  sun: <Sun className="h-5 w-5" />,
  moon: <Moon className="h-5 w-5" />,
  flame: <Flame className="h-5 w-5" />,
  "trending-up": <TrendingUp className="h-5 w-5" />,
  sparkles: <Sparkles className="h-5 w-5" />,
  trophy: <Trophy className="h-5 w-5" />,
  clock: <Clock className="h-5 w-5" />,
  shield: <Shield className="h-5 w-5" />,
  award: <Award className="h-5 w-5" />,
  crown: <Crown className="h-5 w-5" />,
};

interface CmsBadgeConfig { id: string; icon: string; title: string; description: string; metric: string; target: number; }
interface CmsBadgeLevel { name: string; icon: string; badges: CmsBadgeConfig[]; }

const DEFAULT_LEVELS: CmsBadgeLevel[] = [
  {
    name: "Level 1 — Spark", icon: "shield",
    badges: [
      { id: "l1_1", icon: "star", title: "First Step", description: "Complete your first session", metric: "sessions", target: 1 },
      { id: "l1_2", icon: "zap", title: "Getting Started", description: "Complete 3 sessions", metric: "sessions", target: 3 },
      { id: "l1_3", icon: "target", title: "Explorer", description: "Try 2 different activities", metric: "unique_activities", target: 2 },
      { id: "l1_4", icon: "sun", title: "Early Bird", description: "Complete 3 morning sessions", metric: "morning_sessions", target: 3 },
      { id: "l1_5", icon: "moon", title: "Night Owl", description: "Complete 3 evening sessions", metric: "evening_sessions", target: 3 },
      { id: "l1_6", icon: "flame", title: "On Fire", description: "2-week streak", metric: "streak", target: 2 },
      { id: "l1_7", icon: "trending-up", title: "Committed", description: "Complete 5 sessions", metric: "sessions", target: 5 },
      { id: "l1_8", icon: "sparkles", title: "Warming Up", description: "Reach Wellness Score 20", metric: "wellness_score", target: 20 },
    ],
  },
];

const NextBadgeCard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [cmsLevels, setCmsLevels] = useState<CmsBadgeLevel[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("bookings").select("activity, booking_date, booking_time, attendance_status").eq("user_id", user.id),
      supabase.from("page_content").select("content").eq("page_slug", "habits").single(),
    ]).then(([bRes, cRes]) => {
      setBookings(bRes.data || []);
      if (cRes.data?.content) {
        const c = cRes.data.content as Record<string, unknown>;
        if (Array.isArray(c.badge_levels) && c.badge_levels.length > 0) setCmsLevels(c.badge_levels as CmsBadgeLevel[]);
      }
      setLoaded(true);
    });
  }, [user]);

  const nextBadge = useMemo(() => {
    if (!loaded) return null;
    const completed = bookings.filter(b => b.attendance_status === "show");
    const uniqueActs = new Set(completed.map(b => b.activity)).size;
    const morning = completed.filter(b => { const h = parseInt(b.booking_time); return h >= 6 && h < 12; }).length;
    const evening = completed.filter(b => { const h = parseInt(b.booking_time); return h >= 17; }).length;
    const afternoon = completed.filter(b => { const h = parseInt(b.booking_time); return h >= 12 && h < 17; }).length;

    const weekSet = new Set<string>();
    completed.forEach(b => {
      const ws = startOfWeek(parseISO(b.booking_date), { weekStartsOn: 1 });
      weekSet.add(format(ws, "yyyy-MM-dd"));
    });
    const ascending = Array.from(weekSet).sort();
    let longest = ascending.length > 0 ? 1 : 0, run = 1;
    for (let i = 1; i < ascending.length; i++) {
      const diff = differenceInDays(parseISO(ascending[i]), parseISO(ascending[i - 1]));
      if (diff === 7) { run++; longest = Math.max(longest, run); } else run = 1;
    }

    const ws = Math.min(
      Math.min((() => { const weekSet2 = new Set<string>(); completed.forEach(b => weekSet2.add(format(startOfWeek(parseISO(b.booking_date), { weekStartsOn: 1 }), "yyyy-MM-dd"))); const sorted = Array.from(weekSet2).sort().reverse(); const tw = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"); const lw = format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), "yyyy-MM-dd"); let c = 0; if (sorted[0] === tw || sorted[0] === lw) { for (let i = 0; i < sorted.length; i++) { const exp = format(startOfWeek(subWeeks(new Date(), sorted[0] === tw ? i : i + 1), { weekStartsOn: 1 }), "yyyy-MM-dd"); if (sorted[i] === exp) c++; else break; } } return c; })() * 10, 40) +
      Math.min(uniqueActs * 10, 30) + Math.min(completed.length * 2, 30), 100
    );

    const metrics: Record<string, number> = {
      sessions: completed.length, unique_activities: uniqueActs,
      morning_sessions: morning, evening_sessions: evening, afternoon_sessions: afternoon,
      streak: longest, wellness_score: ws,
    };

    const levels = cmsLevels || DEFAULT_LEVELS;
    for (const level of levels) {
      for (const b of level.badges) {
        const val = metrics[b.metric] || 0;
        if (val < b.target) {
          return { ...b, progress: val };
        }
      }
    }
    return null;
  }, [loaded, bookings, cmsLevels]);

  if (!user || !loaded || !nextBadge) return null;

  const remaining = nextBadge.target - nextBadge.progress;
  const pct = Math.round((nextBadge.progress / nextBadge.target) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="w-full max-w-sm lg:max-w-lg mx-auto"
    >
      <div className="rounded-2xl bg-white/[0.04] backdrop-blur-2xl p-4 flex items-center gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] card-hover">
        <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 text-primary glow-violet-subtle">
          {ICON_MAP[nextBadge.icon] || <Star className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground leading-tight">
            You're <span className="text-primary font-bold">{remaining}</span> {nextBadge.metric === "sessions" ? "session" : "step"}{remaining > 1 ? "s" : ""} away from <span className="font-semibold text-foreground">{nextBadge.title}</span> ⚡
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full liquid-fill"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span className="font-label text-[10px] font-medium text-muted-foreground">{nextBadge.progress}/{nextBadge.target}</span>
          </div>
        </div>
        <Link
          to="/book"
          className="shrink-0 text-[10px] font-bold uppercase tracking-wider btn-ghost-violet rounded-lg px-3 py-1.5"
        >
          Book
        </Link>
      </div>
    </motion.div>
  );
};

export default NextBadgeCard;
