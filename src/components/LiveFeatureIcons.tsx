import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRewards } from "@/hooks/useRewards";
import { supabase } from "@/integrations/supabase/client";
import { LoyaltyIcon, MatchmakerIcon, HabitTrackerIcon } from "@/components/icons/BrandIcons";
import { startOfWeek, subWeeks, parseISO } from "date-fns";

const LiveFeatureIcons = () => {
  const { user } = useAuth();
  const { rewards, loaded: rewardsLoaded } = useRewards();
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [labels, setLabels] = useState({ loyalty: "Aura Loyalty", matchmaking: "Matchmaking", habits: "Habits" });

  // Load CMS labels
  useEffect(() => {
    supabase.from("page_content").select("content").eq("page_slug", "home").maybeSingle()
      .then(({ data }) => {
        if (data?.content) {
          const c = data.content as Record<string, any>;
          if (c.feature_icon_labels) {
            setLabels({
              loyalty: c.feature_icon_labels.loyalty || "Aura Loyalty",
              matchmaking: c.feature_icon_labels.matchmaking || "Matchmaking",
              habits: c.feature_icon_labels.habits || "Habits",
            });
          }
        }
      });
  }, []);

  const loyaltyLabel = useMemo(() => {
    if (!rewardsLoaded || !user) return null;
    const best = rewards.filter(r => r.points > 0).sort((a, b) => b.points - a.points)[0];
    if (!best) return "0/5 pts";
    if (best.points < 5) return `${best.points}/5 pts`;
    if (best.points < 10) return `${best.points}/10 pts`;
    return "Reward!";
  }, [rewards, rewardsLoaded, user]);

  useEffect(() => {
    if (!user) return;
    supabase.from("player_selections").select("user_id", { count: "exact", head: true })
      .then(({ count }) => setMatchCount(count ?? 0));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const calcStreak = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("booking_date")
        .eq("user_id", user.id)
        .eq("attendance_status", "show")
        .order("booking_date", { ascending: false });
      if (!data || data.length === 0) { setStreak(0); return; }

      let s = 0;
      const now = new Date();
      for (let w = 0; w < 52; w++) {
        const weekStart = startOfWeek(subWeeks(now, w), { weekStartsOn: 1 });
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const hasBooking = data.some(b => {
          const d = parseISO(b.booking_date);
          return d >= weekStart && d <= weekEnd;
        });
        if (hasBooking) s++;
        else break;
      }
      setStreak(s);
    };
    calcStreak();
  }, [user]);

  if (!user) return null;

  const items = [
    {
      to: "/loyalty",
      icon: <LoyaltyIcon className="h-6 w-6" />,
      label: labels.loyalty,
      stat: loyaltyLabel,
    },
    {
      to: "/matchmaker",
      icon: <MatchmakerIcon className="h-6 w-6" />,
      label: labels.matchmaking,
      stat: matchCount !== null ? `${matchCount} player${matchCount !== 1 ? "s" : ""}` : null,
    },
    {
      to: "/habits",
      icon: <HabitTrackerIcon className="h-6 w-6" />,
      label: labels.habits,
      stat: streak !== null ? (streak > 0 ? `🔥 ${streak}-week streak` : "Start streak") : null,
    },
  ];

  return (
    <div className="flex justify-center gap-4 w-full max-w-sm lg:max-w-lg mx-auto">
      {items.map((item, i) => (
        <motion.div
          key={item.to}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
          className="flex flex-col items-center gap-1.5"
        >
          <Link
            to={item.to}
            className="group relative flex flex-col items-center justify-center rounded-2xl w-20 h-20 lg:w-24 lg:h-24 transition-all duration-500 ease-out bg-white/[0.04] backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[0_0_24px_rgba(124,58,237,0.2)] hover:bg-white/[0.07] hover:scale-105 hover:-translate-y-1"
          >
            <span className="text-primary group-hover:scale-110 transition-transform duration-500">{item.icon}</span>
            {item.stat && (
              <span className="text-[8px] font-semibold text-primary/80 mt-1 leading-none">{item.stat}</span>
            )}
          </Link>
          <span className="font-label text-[9px] font-semibold uppercase tracking-[0.15em] text-foreground/40 leading-tight text-center max-w-[80px]">
            {item.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export default LiveFeatureIcons;
