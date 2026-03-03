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
import { Flame, Trophy, Target, TrendingUp, Zap, Star, Calendar, Sun, Moon, Clock, Sparkles, Gift, ChevronDown, Shield, Award, Crown } from "lucide-react";
import { format, parseISO, startOfWeek, subWeeks, isWithinInterval, startOfDay, endOfDay, differenceInDays, getDay, getHours } from "date-fns";
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

interface PageContent {
  title?: string;
  subtitle?: string;
  sections?: { key: string; title: string; description: string }[];
}

const LEVEL_ICONS = [
  <Shield className="h-5 w-5" />,
  <Award className="h-5 w-5" />,
  <Crown className="h-5 w-5" />,
];

const LEVEL_COLORS = [
  { text: "text-primary", border: "border-primary/40 bg-primary/5", bg: "bg-primary", ring: "ring-primary/20" },
  { text: "text-accent", border: "border-accent/40 bg-accent/5", bg: "bg-accent", ring: "ring-accent/20" },
  { text: "text-amber-400", border: "border-amber-400/40 bg-amber-400/5", bg: "bg-amber-400", ring: "ring-amber-400/20" },
];

interface BadgeLevelData {
  name: string;
  badges: BadgeDef[];
  color: string;
}

const BadgeLevelsAccordion = ({ badgeLevels }: { badgeLevels: BadgeLevelData[] }) => {
  const [openLevels, setOpenLevels] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number) => {
    setOpenLevels(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  return (
    <>
      {badgeLevels.map((level, li) => {
        const levelEarned = level.badges.filter(b => b.earned).length;
        const levelComplete = levelEarned === level.badges.length;
        const colors = LEVEL_COLORS[li];
        const isOpen = openLevels.has(li);

        return (
          <motion.div key={level.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + li * 0.1 }}>
            <Card className="bg-card border-border overflow-hidden">
              <button
                onClick={() => toggle(li)}
                className="w-full text-left"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className={cn("text-base flex items-center gap-2", colors.text)}>
                      {LEVEL_ICONS[li]}
                      {level.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{levelEarned}/8</span>
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
                    </div>
                  </div>
                  <Progress value={(levelEarned / 8) * 100} className="h-1.5 mt-2" />
                  {levelComplete && (
                    <p className="text-xs font-semibold text-emerald-400 mt-2 flex items-center gap-1">
                      <Gift className="h-3.5 w-3.5" />
                      Level complete! +1 free loyalty point earned
                    </p>
                  )}
                </CardHeader>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-3">
                        {level.badges.map((badge) => (
                          <div
                            key={badge.id}
                            className={cn(
                              "relative p-3 rounded-xl border text-center transition-all",
                              badge.earned ? colors.border : "border-border bg-secondary/30 opacity-60"
                            )}
                          >
                            <div className={cn("mx-auto mb-1.5", badge.earned ? colors.text : "text-muted-foreground")}>
                              {badge.icon}
                            </div>
                            <p className="text-xs font-semibold text-foreground">{badge.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</p>
                            {!badge.earned && (
                              <div className="mt-2">
                                <Progress value={(badge.progress / badge.target) * 100} className="h-1" />
                                <p className="text-[10px] text-muted-foreground mt-0.5">{badge.progress}/{badge.target}</p>
                              </div>
                            )}
                            {badge.earned && (
                              <div className={cn("absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center", colors.bg)}>
                                <span className="text-[10px] text-primary-foreground">✓</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        );
      })}
    </>
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

  // Close level info on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (levelInfoRef.current && !levelInfoRef.current.contains(e.target as Node)) {
        setShowLevelInfo(false);
      }
    };
    if (showLevelInfo) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showLevelInfo]);

  // === Calculations ===
  const completedBookings = useMemo(() =>
    bookings.filter(b => b.attendance_status === "show"), [bookings]);

  const allConfirmed = useMemo(() =>
    bookings.filter(b => b.status === "confirmed" || b.attendance_status === "show"), [bookings]);

  // Streak: consecutive weeks with at least 1 completed booking
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
    // Current streak starts from this or last week
    if (sortedWeeks[0] === thisWeek || sortedWeeks[0] === lastWeek) {
      for (let i = 0; i < sortedWeeks.length; i++) {
        const expected = format(startOfWeek(subWeeks(new Date(), sortedWeeks[0] === thisWeek ? i : i + 1), { weekStartsOn: 1 }), "yyyy-MM-dd");
        if (sortedWeeks[i] === expected) current++;
        else break;
      }
    }
    // Longest streak
    const ascending = Array.from(weekSet).sort();
    let longest = 1, run = 1;
    for (let i = 1; i < ascending.length; i++) {
      const diff = differenceInDays(parseISO(ascending[i]), parseISO(ascending[i - 1]));
      if (diff === 7) { run++; longest = Math.max(longest, run); }
      else run = 1;
    }
    if (ascending.length <= 1) longest = ascending.length;
    return { currentStreak: current, longestStreak: Math.max(longest, current) };
  }, [completedBookings]);

  // Unique activities
  const uniqueActivities = useMemo(() =>
    new Set(completedBookings.map(b => b.activity)).size, [completedBookings]);

  // Wellness Score (0-100)
  const wellnessScore = useMemo(() => {
    if (!completedBookings.length) return 0;
    const consistencyScore = Math.min(currentStreak * 10, 40); // max 40
    const varietyScore = Math.min(uniqueActivities * 10, 30); // max 30
    const frequencyScore = Math.min(completedBookings.length * 2, 30); // max 30
    return Math.min(consistencyScore + varietyScore + frequencyScore, 100);
  }, [currentStreak, uniqueActivities, completedBookings]);

  // Heatmap: last 12 weeks, 7 days each
  const heatmapData = useMemo(() => {
    const weeks: { date: Date; count: number }[][] = [];
    for (let w = 11; w >= 0; w--) {
      const weekStart = startOfWeek(subWeeks(new Date(), w), { weekStartsOn: 1 });
      const days: { date: Date; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + d);
        const dateStr = format(date, "yyyy-MM-dd");
        const count = allConfirmed.filter(b => b.booking_date === dateStr).length;
        days.push({ date, count });
      }
      weeks.push(days);
    }
    return weeks;
  }, [allConfirmed]);

  // Time distribution
  const timeDistribution = useMemo(() => {
    const morning = completedBookings.filter(b => {
      const h = parseInt(b.booking_time);
      return h >= 6 && h < 12;
    }).length;
    const afternoon = completedBookings.filter(b => {
      const h = parseInt(b.booking_time);
      return h >= 12 && h < 17;
    }).length;
    const evening = completedBookings.filter(b => {
      const h = parseInt(b.booking_time);
      return h >= 17;
    }).length;
    const total = morning + afternoon + evening || 1;
    return { morning, afternoon, evening, total };
  }, [completedBookings]);

  // Favorite activity
  const favoriteActivity = useMemo(() => {
    if (!completedBookings.length) return null;
    const counts: Record<string, { count: number; name: string }> = {};
    completedBookings.forEach(b => {
      if (!counts[b.activity]) counts[b.activity] = { count: 0, name: b.activity_name };
      counts[b.activity].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count)[0];
  }, [completedBookings]);

  // Badge Levels — 3 levels, 8 badges each
  const badgeLevels = useMemo(() => {
    const level1: BadgeDef[] = [
      { id: "l1_first_step", icon: <Star className="h-5 w-5" />, title: "First Step", description: "Complete your first session", earned: completedBookings.length >= 1, progress: Math.min(completedBookings.length, 1), target: 1 },
      { id: "l1_three_sessions", icon: <Zap className="h-5 w-5" />, title: "Getting Started", description: "Complete 3 sessions", earned: completedBookings.length >= 3, progress: Math.min(completedBookings.length, 3), target: 3 },
      { id: "l1_explorer", icon: <Target className="h-5 w-5" />, title: "Explorer", description: "Try 2 different activities", earned: uniqueActivities >= 2, progress: Math.min(uniqueActivities, 2), target: 2 },
      { id: "l1_early_bird", icon: <Sun className="h-5 w-5" />, title: "Early Bird", description: "Complete 3 morning sessions", earned: timeDistribution.morning >= 3, progress: Math.min(timeDistribution.morning, 3), target: 3 },
      { id: "l1_night_owl", icon: <Moon className="h-5 w-5" />, title: "Night Owl", description: "Complete 3 evening sessions", earned: timeDistribution.evening >= 3, progress: Math.min(timeDistribution.evening, 3), target: 3 },
      { id: "l1_streak_2", icon: <Flame className="h-5 w-5" />, title: "On Fire", description: "2-week streak", earned: longestStreak >= 2, progress: Math.min(currentStreak, 2), target: 2 },
      { id: "l1_five_sessions", icon: <TrendingUp className="h-5 w-5" />, title: "Committed", description: "Complete 5 sessions", earned: completedBookings.length >= 5, progress: Math.min(completedBookings.length, 5), target: 5 },
      { id: "l1_wellness_30", icon: <Sparkles className="h-5 w-5" />, title: "Warming Up", description: "Reach Wellness Score 30", earned: wellnessScore >= 30, progress: Math.min(wellnessScore, 30), target: 30 },
    ];
    const level2: BadgeDef[] = [
      { id: "l2_ten_sessions", icon: <Star className="h-5 w-5" />, title: "Regular", description: "Complete 10 sessions", earned: completedBookings.length >= 10, progress: Math.min(completedBookings.length, 10), target: 10 },
      { id: "l2_explorer_3", icon: <Target className="h-5 w-5" />, title: "Adventurer", description: "Try 3 different activities", earned: uniqueActivities >= 3, progress: Math.min(uniqueActivities, 3), target: 3 },
      { id: "l2_streak_4", icon: <Flame className="h-5 w-5" />, title: "Iron Will", description: "4-week streak", earned: longestStreak >= 4, progress: Math.min(currentStreak, 4), target: 4 },
      { id: "l2_morning_5", icon: <Sun className="h-5 w-5" />, title: "Dawn Warrior", description: "Complete 5 morning sessions", earned: timeDistribution.morning >= 5, progress: Math.min(timeDistribution.morning, 5), target: 5 },
      { id: "l2_evening_5", icon: <Moon className="h-5 w-5" />, title: "Moonlight Athlete", description: "Complete 5 evening sessions", earned: timeDistribution.evening >= 5, progress: Math.min(timeDistribution.evening, 5), target: 5 },
      { id: "l2_twenty_sessions", icon: <Trophy className="h-5 w-5" />, title: "Dedicated", description: "Complete 20 sessions", earned: completedBookings.length >= 20, progress: Math.min(completedBookings.length, 20), target: 20 },
      { id: "l2_afternoon_5", icon: <TrendingUp className="h-5 w-5" />, title: "Afternoon Pro", description: "Complete 5 afternoon sessions", earned: timeDistribution.afternoon >= 5, progress: Math.min(timeDistribution.afternoon, 5), target: 5 },
      { id: "l2_wellness_60", icon: <Sparkles className="h-5 w-5" />, title: "Rising Star", description: "Reach Wellness Score 60", earned: wellnessScore >= 60, progress: Math.min(wellnessScore, 60), target: 60 },
    ];
    const level3: BadgeDef[] = [
      { id: "l3_fifty_sessions", icon: <Star className="h-5 w-5" />, title: "Veteran", description: "Complete 50 sessions", earned: completedBookings.length >= 50, progress: Math.min(completedBookings.length, 50), target: 50 },
      { id: "l3_explorer_5", icon: <Target className="h-5 w-5" />, title: "All-Rounder", description: "Try 5 different activities", earned: uniqueActivities >= 5, progress: Math.min(uniqueActivities, 5), target: 5 },
      { id: "l3_streak_8", icon: <Flame className="h-5 w-5" />, title: "Unstoppable", description: "8-week streak", earned: longestStreak >= 8, progress: Math.min(currentStreak, 8), target: 8 },
      { id: "l3_morning_10", icon: <Sun className="h-5 w-5" />, title: "Sunrise Legend", description: "10 morning sessions", earned: timeDistribution.morning >= 10, progress: Math.min(timeDistribution.morning, 10), target: 10 },
      { id: "l3_evening_10", icon: <Moon className="h-5 w-5" />, title: "Night Legend", description: "10 evening sessions", earned: timeDistribution.evening >= 10, progress: Math.min(timeDistribution.evening, 10), target: 10 },
      { id: "l3_hundred_sessions", icon: <Trophy className="h-5 w-5" />, title: "Centurion", description: "Complete 100 sessions", earned: completedBookings.length >= 100, progress: Math.min(completedBookings.length, 100), target: 100 },
      { id: "l3_streak_12", icon: <Zap className="h-5 w-5" />, title: "Relentless", description: "12-week streak", earned: longestStreak >= 12, progress: Math.min(currentStreak, 12), target: 12 },
      { id: "l3_wellness_100", icon: <Sparkles className="h-5 w-5" />, title: "Transcendent", description: "Reach Wellness Score 100", earned: wellnessScore >= 100, progress: wellnessScore, target: 100 },
    ];
    return [
      { name: "Level 1 — Rookie", badges: level1, color: "primary" },
      { name: "Level 2 — Athlete", badges: level2, color: "accent" },
      { name: "Level 3 — Legend", badges: level3, color: "amber" },
    ];
  }, [completedBookings, longestStreak, currentStreak, uniqueActivities, timeDistribution, wellnessScore]);

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

  const getHeatmapColor = (count: number) => {
    if (count === 0) return "bg-secondary";
    if (count === 1) return "bg-primary/30";
    if (count === 2) return "bg-primary/60";
    return "bg-primary";
  };

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
          <div className="text-center mb-12">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
            </motion.div>
            <h1 className="font-heading text-2xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3">
              {cmsContent.title || "AI Habit Tracker"}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {cmsContent.subtitle || "Discover your wellness patterns. Track streaks, earn badges, and get personalized insights."}
            </p>
          </div>

          {!user ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Sparkles className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Sign in to track your habits</h2>
              <p className="text-muted-foreground mb-6">Create an account and start booking sessions to unlock your personalized wellness dashboard.</p>
              <Button onClick={() => navigate("/auth")} className="glow px-8 h-12 font-semibold text-base">
                Login / Sign Up
              </Button>
            </motion.div>
          ) : (
          <>
          {/* Top Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 items-stretch">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="h-full">
              <Card className="bg-card border-border text-center h-full">
                <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center h-full">
                  <Flame className="h-8 w-8 text-orange-400 mb-2" />
                  <p className="text-3xl font-bold text-foreground">{currentStreak}</p>
                  <p className="text-xs text-muted-foreground mt-1">Week Streak</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="h-full">
              <Card className="bg-card border-border text-center h-full">
                <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center h-full">
                  <div className={`text-3xl font-bold ${getScoreColor(wellnessScore)}`}>{wellnessScore}</div>
                  <p className="text-xs text-muted-foreground mt-1">Wellness Score</p>
                  <Progress value={wellnessScore} className="mt-2 h-1.5 w-full" />
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="h-full relative">
              <Card
                className="bg-card border-border text-center h-full cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setShowLevelInfo(prev => !prev)}
              >
                <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center h-full">
                  {completedLevels === 0 && <Shield className="h-8 w-8 text-primary mb-2" />}
                  {completedLevels === 1 && <Award className="h-8 w-8 text-accent mb-2" />}
                  {completedLevels === 2 && <Crown className="h-8 w-8 text-amber-400 mb-2" />}
                  {completedLevels === 3 && <Crown className="h-8 w-8 text-amber-400 mb-2" />}
                  <p className="text-3xl font-bold text-foreground">{completedLevels}/3</p>
                  <p className="text-xs text-muted-foreground mt-1">Level Reached</p>
                </CardContent>
              </Card>
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
                      There are <span className="font-semibold text-foreground">3 levels</span> with 8 badges each. Every time you complete all 8 badges in a level, you earn a <span className="font-semibold text-primary">free loyalty point</span> that you can assign to any club of your choice in your profile!
                    </p>
                    <div className="mt-3 space-y-1.5">
                      {badgeLevels.map((lvl, i) => {
                        const earned = lvl.badges.filter(b => b.earned).length;
                        const complete = earned === lvl.badges.length;
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className={cn(complete ? LEVEL_COLORS[i].text : "text-muted-foreground")}>{LEVEL_ICONS[i]}</span>
                            <span className={cn("flex-1", complete ? "text-foreground font-medium" : "text-muted-foreground")}>{lvl.name}</span>
                            <span className={cn("text-[10px]", complete ? "text-emerald-400" : "text-muted-foreground")}>{complete ? "✓ +1 point" : `${earned}/8`}</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="h-full">
              <Card className="bg-card border-border text-center h-full">
                <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center h-full">
                  <TrendingUp className="h-8 w-8 text-primary mb-2" />
                  <p className="text-3xl font-bold text-foreground">{completedBookings.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Sessions Done</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Heatmap */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Activity Heatmap
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Last 12 weeks of booking activity</p>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <div className="inline-grid gap-[3px]" style={{ gridTemplateRows: "repeat(7, 1fr)", gridAutoFlow: "column", gridAutoColumns: "min-content" }}>
                        {/* Day labels */}
                        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                          <div key={`label-${i}`} className="w-3 h-3 flex items-center justify-end pr-1 text-[8px] text-muted-foreground leading-none">{i % 2 === 0 ? d : ""}</div>
                        ))}
                        {/* Week columns */}
                        {heatmapData.map((week, wi) =>
                          week.map((day, di) => (
                            <div
                              key={`${wi}-${di}`}
                              className={`w-3 h-3 rounded-[2px] ${getHeatmapColor(day.count)} transition-all hover:ring-1 hover:ring-primary/50`}
                              title={`${format(day.date, "MMM dd")}: ${day.count} booking${day.count !== 1 ? "s" : ""}`}
                            />
                          ))
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-3">
                      <span className="text-[10px] text-muted-foreground">Less</span>
                      <div className="h-3 w-3 rounded-sm bg-secondary" />
                      <div className="h-3 w-3 rounded-sm bg-primary/30" />
                      <div className="h-3 w-3 rounded-sm bg-primary/60" />
                      <div className="h-3 w-3 rounded-sm bg-primary" />
                      <span className="text-[10px] text-muted-foreground">More</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI Insights */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      AI Insights
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Personalized tips based on your habits</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights.map((tip, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="p-3 rounded-lg bg-secondary/50 border border-border text-sm text-foreground"
                        >
                          {tip}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Time Distribution */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
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

              {/* Badges — 3 Levels (Collapsible) */}
              <BadgeLevelsAccordion badgeLevels={badgeLevels} />
            </div>
          </div>
          </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default HabitsPage;
