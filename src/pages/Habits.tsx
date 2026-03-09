import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, Target, TrendingUp, Zap, Star, Sun, Moon, Clock, Sparkles, Gift, ChevronDown, Shield, Award, Crown } from "lucide-react";
import { format, parseISO, startOfWeek, subWeeks, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface BookingRow {
  id: string;
  activity: string;
  activity_name: string;
  booking_date: string;
  booking_time: string;
  attendance_status: string | null;
  status: string;
}

interface BadgeDef {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  earned: boolean;
  progress: number;
  target: number;
}

interface FeatureBadge {
  label: string;
  use_gold?: boolean;
}

interface PageContent {
  title?: string;
  subtitle?: string;
  badge_levels?: CmsBadgeLevel[];
  feature_badges?: FeatureBadge[];
}

interface CmsBadgeConfig {
  id: string;
  icon: string;
  title: string;
  description: string;
  metric: string;
  target: number;
}

interface CmsBadgeLevel {
  name: string;
  icon: string;
  badges: CmsBadgeConfig[];
}

const ICON_MAP: Record<string, (cls: string) => React.ReactNode> = {
  star: (c) => <Star className={c} />,
  zap: (c) => <Zap className={c} />,
  target: (c) => <Target className={c} />,
  sun: (c) => <Sun className={c} />,
  moon: (c) => <Moon className={c} />,
  flame: (c) => <Flame className={c} />,
  "trending-up": (c) => <TrendingUp className={c} />,
  sparkles: (c) => <Sparkles className={c} />,
  trophy: (c) => <Trophy className={c} />,
  clock: (c) => <Clock className={c} />,
  shield: (c) => <Shield className={c} />,
  award: (c) => <Award className={c} />,
  crown: (c) => <Crown className={c} />,
};

const getIcon = (name: string, cls: string) => (ICON_MAP[name] || ICON_MAP.star)(cls);

const LEVEL_COLORS = [
  { text: "text-primary", border: "border-primary/40 bg-primary/5", bg: "bg-primary", ring: "ring-primary/20" },
  { text: "text-accent", border: "border-accent/40 bg-accent/5", bg: "bg-accent", ring: "ring-accent/20" },
  { text: "text-amber-400", border: "border-amber-400/40 bg-amber-400/5", bg: "bg-amber-400", ring: "ring-amber-400/20" },
  { text: "text-emerald-400", border: "border-emerald-400/40 bg-emerald-400/5", bg: "bg-emerald-400", ring: "ring-emerald-400/20" },
  { text: "text-rose-400", border: "border-rose-400/40 bg-rose-400/5", bg: "bg-rose-400", ring: "ring-rose-400/20" },
];

interface BadgeLevelData {
  name: string;
  icon: string;
  badges: BadgeDef[];
  color: string;
}

const BadgeLevelSection = ({ level, li, defaultOpen }: { level: BadgeLevelData; li: number; defaultOpen: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const levelEarned = level.badges.filter(b => b.earned).length;
  const levelComplete = levelEarned === level.badges.length;
  const colors = LEVEL_COLORS[li % LEVEL_COLORS.length];
  const progressPct = (levelEarned / level.badges.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + li * 0.15, duration: 0.5 }}
    >
      <div className={cn(
        "rounded-2xl border overflow-hidden transition-all duration-300",
        levelComplete ? colors.border : "border-border bg-card"
      )}>
        <button onClick={() => setIsOpen(o => !o)} className="w-full text-left">
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex-shrink-0 h-14 w-14 rounded-xl flex items-center justify-center border",
                levelComplete ? `${colors.border} ${colors.text}` : "border-border bg-secondary/50 text-muted-foreground"
              )}>
                {getIcon(level.icon, "h-10 w-10")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={cn("font-heading text-lg font-bold", levelComplete ? colors.text : "text-foreground")}>
                    {level.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">{levelEarned}/{level.badges.length}</span>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
                  </div>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", colors.bg)}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1, delay: 0.4 + li * 0.2, ease: "easeOut" }}
                  />
                </div>
                {levelComplete && (
                  <p className="text-xs font-semibold text-emerald-400 mt-2 flex items-center gap-1">
                    <Gift className="h-3.5 w-3.5" />
                    Level complete — +1 free loyalty point earned!
                  </p>
                )}
              </div>
            </div>
          </div>
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {level.badges.map((badge, bi) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: bi * 0.04 }}
                      className={cn(
                        "relative p-3 rounded-xl border text-center transition-all",
                        badge.earned
                          ? `${colors.border} shadow-sm`
                          : "border-border bg-secondary/20 opacity-50"
                      )}
                    >
                      <div className={cn(
                        "mx-auto mb-2 h-8 w-8 rounded-lg flex items-center justify-center",
                        badge.earned ? `${colors.text}` : "text-muted-foreground"
                      )}>
                        {badge.icon}
                      </div>
                      <p className="text-xs font-semibold text-foreground leading-tight">{badge.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{badge.description}</p>
                      {!badge.earned && (
                        <div className="mt-2">
                          <div className="h-1 rounded-full bg-secondary overflow-hidden">
                            <div className={cn("h-full rounded-full", colors.bg)} style={{ width: `${(badge.progress / badge.target) * 100}%` }} />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{badge.progress}/{badge.target}</p>
                        </div>
                      )}
                      {badge.earned && (
                        <div className={cn("absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center shadow-sm", colors.bg)}>
                          <span className="text-[10px] text-primary-foreground font-bold">✓</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const HabitsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLevelInfo, setShowLevelInfo] = useState(false);
  const levelInfoRef = useRef<HTMLDivElement>(null);
  const [cmsContent, setCmsContent] = useState<PageContent>({});

  useEffect(() => {
    supabase.from("page_content").select("content").eq("page_slug", "habits").single().then(({ data }) => {
      if (data) setCmsContent(data.content as unknown as PageContent);
    });
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    const fetchBookings = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("bookings")
        .select("id, activity, activity_name, booking_date, booking_time, attendance_status, status")
        .eq("user_id", user.id)
        .order("booking_date", { ascending: false });
      setBookings((data as BookingRow[]) || []);
      setLoading(false);
    };
    fetchBookings();
  }, [user, authLoading]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (levelInfoRef.current && !levelInfoRef.current.contains(e.target as Node)) {
        setShowLevelInfo(false);
      }
    };
    if (showLevelInfo) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showLevelInfo]);

  const completedBookings = useMemo(() =>
    bookings.filter(b => b.attendance_status === "show"), [bookings]);

  const { currentStreak, longestStreak } = useMemo(() => {
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

  const uniqueActivities = useMemo(() =>
    new Set(completedBookings.map(b => b.activity)).size, [completedBookings]);

  const wellnessScore = useMemo(() => {
    if (!completedBookings.length) return 0;
    const c = Math.min(currentStreak * 10, 40);
    const v = Math.min(uniqueActivities * 10, 30);
    const f = Math.min(completedBookings.length * 2, 30);
    return Math.min(c + v + f, 100);
  }, [currentStreak, uniqueActivities, completedBookings]);

  const timeDistribution = useMemo(() => {
    const morning = completedBookings.filter(b => { const h = parseInt(b.booking_time); return h >= 6 && h < 12; }).length;
    const afternoon = completedBookings.filter(b => { const h = parseInt(b.booking_time); return h >= 12 && h < 17; }).length;
    const evening = completedBookings.filter(b => { const h = parseInt(b.booking_time); return h >= 17; }).length;
    const total = morning + afternoon + evening || 1;
    return { morning, afternoon, evening, total };
  }, [completedBookings]);

  const favoriteActivity = useMemo(() => {
    if (!completedBookings.length) return null;
    const counts: Record<string, { count: number; name: string }> = {};
    completedBookings.forEach(b => {
      if (!counts[b.activity]) counts[b.activity] = { count: 0, name: b.activity_name };
      counts[b.activity].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count)[0];
  }, [completedBookings]);

  // Metrics map for CMS-driven badges
  const metricsMap = useMemo(() => ({
    sessions: completedBookings.length,
    unique_activities: uniqueActivities,
    morning_sessions: timeDistribution.morning,
    evening_sessions: timeDistribution.evening,
    afternoon_sessions: timeDistribution.afternoon,
    streak: longestStreak,
    wellness_score: wellnessScore,
  }), [completedBookings, uniqueActivities, timeDistribution, longestStreak, wellnessScore]);

  // Build badge levels from CMS or fallback
  const badgeLevels: BadgeLevelData[] = useMemo(() => {
    const cmsBadges = cmsContent.badge_levels;

    // Default hardcoded levels as CMS format
    const defaultLevels: CmsBadgeLevel[] = [
      {
        name: "Level 1 — Rookie", icon: "shield",
        badges: [
          { id: "l1_1", icon: "star", title: "First Step", description: "Complete your first session", metric: "sessions", target: 1 },
          { id: "l1_2", icon: "zap", title: "Getting Started", description: "Complete 3 sessions", metric: "sessions", target: 3 },
          { id: "l1_3", icon: "target", title: "Explorer", description: "Try 2 different activities", metric: "unique_activities", target: 2 },
          { id: "l1_4", icon: "sun", title: "Early Bird", description: "Complete 3 morning sessions", metric: "morning_sessions", target: 3 },
          { id: "l1_5", icon: "moon", title: "Night Owl", description: "Complete 3 evening sessions", metric: "evening_sessions", target: 3 },
          { id: "l1_6", icon: "flame", title: "On Fire", description: "2-week streak", metric: "streak", target: 2 },
          { id: "l1_7", icon: "trending-up", title: "Committed", description: "Complete 5 sessions", metric: "sessions", target: 5 },
          { id: "l1_8", icon: "sparkles", title: "Warming Up", description: "Reach Wellness Score 30", metric: "wellness_score", target: 30 },
        ],
      },
      {
        name: "Level 2 — Athlete", icon: "award",
        badges: [
          { id: "l2_1", icon: "star", title: "Regular", description: "Complete 10 sessions", metric: "sessions", target: 10 },
          { id: "l2_2", icon: "target", title: "Adventurer", description: "Try 3 different activities", metric: "unique_activities", target: 3 },
          { id: "l2_3", icon: "flame", title: "Iron Will", description: "4-week streak", metric: "streak", target: 4 },
          { id: "l2_4", icon: "sun", title: "Dawn Warrior", description: "Complete 5 morning sessions", metric: "morning_sessions", target: 5 },
          { id: "l2_5", icon: "moon", title: "Moonlight Athlete", description: "Complete 5 evening sessions", metric: "evening_sessions", target: 5 },
          { id: "l2_6", icon: "trophy", title: "Dedicated", description: "Complete 20 sessions", metric: "sessions", target: 20 },
          { id: "l2_7", icon: "trending-up", title: "Afternoon Pro", description: "Complete 5 afternoon sessions", metric: "afternoon_sessions", target: 5 },
          { id: "l2_8", icon: "sparkles", title: "Rising Star", description: "Reach Wellness Score 60", metric: "wellness_score", target: 60 },
        ],
      },
      {
        name: "Level 3 — Legend", icon: "crown",
        badges: [
          { id: "l3_1", icon: "star", title: "Veteran", description: "Complete 50 sessions", metric: "sessions", target: 50 },
          { id: "l3_2", icon: "target", title: "All-Rounder", description: "Try 5 different activities", metric: "unique_activities", target: 5 },
          { id: "l3_3", icon: "flame", title: "Unstoppable", description: "8-week streak", metric: "streak", target: 8 },
          { id: "l3_4", icon: "sun", title: "Sunrise Legend", description: "10 morning sessions", metric: "morning_sessions", target: 10 },
          { id: "l3_5", icon: "moon", title: "Night Legend", description: "10 evening sessions", metric: "evening_sessions", target: 10 },
          { id: "l3_6", icon: "trophy", title: "Centurion", description: "Complete 100 sessions", metric: "sessions", target: 100 },
          { id: "l3_7", icon: "zap", title: "Relentless", description: "12-week streak", metric: "streak", target: 12 },
          { id: "l3_8", icon: "sparkles", title: "Transcendent", description: "Reach Wellness Score 100", metric: "wellness_score", target: 100 },
        ],
      },
    ];

    const source = (cmsBadges && cmsBadges.length > 0) ? cmsBadges : defaultLevels;

    return source.map((lvl, li) => ({
      name: lvl.name,
      icon: lvl.icon,
      color: LEVEL_COLORS[li % LEVEL_COLORS.length].text,
      badges: lvl.badges.map(b => {
        const val = metricsMap[b.metric as keyof typeof metricsMap] || 0;
        return {
          id: b.id,
          icon: getIcon(b.icon, "h-5 w-5"),
          title: b.title,
          description: b.description,
          earned: val >= b.target,
          progress: Math.min(val, b.target),
          target: b.target,
        };
      }),
    }));
  }, [cmsContent.badge_levels, metricsMap]);

  const completedLevels = badgeLevels.filter(lvl => lvl.badges.every(b => b.earned)).length;

  // AI Insights
  const insights = useMemo(() => {
    const tips: string[] = [];
    if (completedBookings.length === 0) {
      tips.push("🎯 Book your first session to start tracking your wellness journey!");
      return tips;
    }
    if (currentStreak === 0) tips.push("🔥 You don't have an active streak yet. Book a session this week to start building momentum!");
    else if (currentStreak >= 4) tips.push(`🔥 Amazing ${currentStreak}-week streak! You're on fire — keep the momentum going!`);
    else tips.push(`🔥 You're on a ${currentStreak}-week streak. ${4 - currentStreak} more week${4 - currentStreak === 1 ? "" : "s"} to unlock the Iron Will badge!`);

    if (uniqueActivities === 1) tips.push("🌈 You've only tried one activity. Diversify your routine to boost your Wellness Score!");
    else if (uniqueActivities >= 3) tips.push(`🌈 Great variety! You've explored ${uniqueActivities} different activities.`);

    if (timeDistribution.morning > timeDistribution.evening * 2) tips.push("☀️ You're a morning person! Your energy peaks early — keep it up.");
    else if (timeDistribution.evening > timeDistribution.morning * 2) tips.push("🌙 Night owl detected! You prefer evening sessions. Consider mixing in a morning workout for balance.");

    const allBadges = badgeLevels.flatMap(l => l.badges);
    const nextBadge = allBadges.find(b => !b.earned);
    if (nextBadge) tips.push(`🏆 Next badge: "${nextBadge.title}" — ${nextBadge.description}. You're ${Math.round((nextBadge.progress / nextBadge.target) * 100)}% there!`);

    if (completedLevels > 0) tips.push(`🎁 You've completed ${completedLevels} badge level${completedLevels > 1 ? "s" : ""}! That's ${completedLevels} free loyalty point${completedLevels > 1 ? "s" : ""} to add to any club.`);

    if (favoriteActivity) tips.push(`💪 Your go-to: ${favoriteActivity.name} with ${favoriteActivity.count} sessions. ${uniqueActivities < 3 ? "Try something new to level up!" : "Well-rounded athlete!"}`);

    return tips;
  }, [completedBookings, currentStreak, uniqueActivities, timeDistribution, badgeLevels, completedLevels, favoriteActivity]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading your habits...</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 50) return "text-amber-400";
    return "text-muted-foreground";
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="font-heading text-2xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3">
              {cmsContent.title || "Habit Tracker"}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              {cmsContent.subtitle || "Discover your wellness patterns. Track streaks, earn badges, and get personalized insights."}
            </p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-stretch justify-center gap-1.5 sm:gap-3 max-w-full mx-auto overflow-x-auto pb-2 scrollbar-hide"
            >
              {(() => {
                const defaultBadges: FeatureBadge[] = [
                  { label: "Streaks" },
                  { label: "Badges" },
                  { label: "Wellness Score" },
                  { label: "AI Insights" },
                  { label: "Session Patterns" },
                ];
                const badges = (cmsContent.feature_badges && cmsContent.feature_badges.length > 0) ? cmsContent.feature_badges : defaultBadges;
                const defaultHues = [160, 200, 280, 40, 340];
                const goldHue = 43;
                const iconMap: Record<string, React.ReactNode> = {
                  Streaks: <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
                  Badges: <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
                  "Wellness Score": <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
                  "AI Insights": <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
                  "Session Patterns": <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
                };
                return badges.map((c, i) => {
                  const hue = c.use_gold ? goldHue : defaultHues[i % defaultHues.length];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 200 }}
                      whileHover={{ scale: 1.08, y: -2 }}
                      className="group relative flex flex-col sm:flex-row items-center gap-1 sm:gap-2.5 rounded-xl sm:rounded-2xl px-2.5 py-2 sm:px-5 sm:py-3 text-foreground cursor-default overflow-hidden shrink-0"
                      style={{
                        background: `linear-gradient(135deg, hsl(${hue} 50% 15% / 0.6), hsl(${hue} 40% 20% / 0.3))`,
                        border: `1px solid hsl(${hue} 50% 40% / 0.35)`,
                        boxShadow: `0 0 12px hsl(${hue} 60% 50% / 0.25), 0 0 30px hsl(${hue} 60% 50% / 0.12), inset 0 1px 0 hsl(${hue} 50% 80% / 0.1)`,
                      }}
                    >
                      <span
                        className="flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full"
                        style={{
                          background: `hsl(${hue} 60% 50% / 0.2)`,
                          color: `hsl(${hue} 70% 65%)`,
                          border: `1px solid hsl(${hue} 60% 50% / 0.3)`,
                        }}
                      >
                        {iconMap[c.label] || <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                      </span>
                      <span className="whitespace-nowrap text-[10px] sm:text-sm font-semibold leading-tight text-center">{c.label}</span>
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at 30% 50%, hsl(${hue} 60% 50% / 0.1), transparent 70%)`,
                        }}
                      />
                    </motion.div>
                  );
                });
              })()}
            </motion.div>
          </div>

          {!user ? (
            <>
              <div className="w-full max-w-md mx-auto h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent mb-8" />
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pb-12">
                <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <h2 className="font-heading text-xl font-bold text-foreground mb-2">Sign in to track your habits</h2>
                <p className="text-muted-foreground text-sm mb-5">Create an account and start booking sessions to unlock your personalized wellness dashboard.</p>
                <Button onClick={() => navigate("/auth")} className="glow px-8 h-11 font-semibold">
                  Login / Sign Up
                </Button>
              </motion.div>
            </>
          ) : (
          <>
          {/* Session Times — moved right after subtitle */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Session Times
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Sun className="h-3.5 w-3.5 text-amber-400" /> Morning</span>
                    <span className="font-medium text-foreground">{timeDistribution.morning}</span>
                  </div>
                  <Progress value={(timeDistribution.morning / timeDistribution.total) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><TrendingUp className="h-3.5 w-3.5 text-orange-400" /> Afternoon</span>
                    <span className="font-medium text-foreground">{timeDistribution.afternoon}</span>
                  </div>
                  <Progress value={(timeDistribution.afternoon / timeDistribution.total) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Moon className="h-3.5 w-3.5 text-indigo-400" /> Evening</span>
                    <span className="font-medium text-foreground">{timeDistribution.evening}</span>
                  </div>
                  <Progress value={(timeDistribution.evening / timeDistribution.total) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick stats strip — SWAPPED: Levels first, Week Streak last */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-10 py-4 px-6 rounded-xl border border-border bg-card/50"
          >
            {/* Levels — with glow/ping animation */}
            <div className="text-center relative">
              <button onClick={() => setShowLevelInfo(prev => !prev)} className="hover:opacity-80 transition-opacity group">
                <div className="relative flex items-center justify-center gap-1.5 mb-0.5">
                  {/* Ping ring */}
                  <span className="absolute inset-0 rounded-full animate-ping bg-primary/20 pointer-events-none" />
                  <span className="relative flex items-center gap-1.5">
                    {completedLevels === 0 && <Shield className="h-4 w-4 text-primary animate-pulse" />}
                    {completedLevels === 1 && <Award className="h-4 w-4 text-accent animate-pulse" />}
                    {completedLevels >= 2 && <Crown className="h-4 w-4 text-amber-400 animate-pulse" />}
                    <span className="text-2xl font-bold text-foreground">{completedLevels}/{badgeLevels.length}</span>
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Levels</p>
              </button>
              <AnimatePresence>
                {showLevelInfo && (
                  <motion.div
                    ref={levelInfoRef}
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 w-72 bg-popover border border-border rounded-xl shadow-xl p-4 text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">Level Rewards</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      There are <span className="font-semibold text-foreground">{badgeLevels.length} levels</span>. Complete all badges in a level to earn a <span className="font-semibold text-primary">free loyalty point</span>!
                    </p>
                    <div className="mt-3 space-y-1.5">
                      {badgeLevels.map((lvl, i) => {
                        const earned = lvl.badges.filter(b => b.earned).length;
                        const complete = earned === lvl.badges.length;
                        const colors = LEVEL_COLORS[i % LEVEL_COLORS.length];
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className={cn(complete ? colors.text : "text-muted-foreground")}>{getIcon(lvl.icon, "h-4 w-4")}</span>
                            <span className={cn("flex-1", complete ? "text-foreground font-medium" : "text-muted-foreground")}>{lvl.name}</span>
                            <span className={cn("text-[10px]", complete ? "text-emerald-400" : "text-muted-foreground")}>{complete ? "✓ +1 point" : `${earned}/${lvl.badges.length}`}</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(wellnessScore)}`}>{wellnessScore}</div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Wellness Score</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="text-center">
              <span className="text-2xl font-bold text-foreground">{completedBookings.length}</span>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Sessions</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Flame className="h-4 w-4 text-orange-400" />
                <span className="text-2xl font-bold text-foreground">{currentStreak}</span>
              </div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Week Streak</p>
            </div>
          </motion.div>

          {/* === BADGE LEVELS === */}
          <div className="space-y-4 mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-xl font-bold text-foreground">Your Badges</h2>
            </div>
            {badgeLevels.map((level, li) => (
              <BadgeLevelSection key={level.name} level={level} li={li} defaultOpen={li === 0} />
            ))}
          </div>

          {/* AI Insights — full width */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {insights.map((tip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.08 }}
                      className="p-3 rounded-lg bg-secondary/50 border border-border text-sm text-foreground"
                    >
                      {tip}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default HabitsPage;
