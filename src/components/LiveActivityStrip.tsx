import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNowStrict, parseISO } from "date-fns";

interface ActivityItem {
  id: string;
  text: string;
  initials: string;
  time: string;
  highlight?: boolean;
  link?: string;
}

const LiveActivityStrip = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [feedLabel, setFeedLabel] = useState("Pulse Feed");

  useEffect(() => {
    supabase.from("page_content").select("content").eq("page_slug", "home").maybeSingle()
      .then(({ data }) => {
        if (data?.content) {
          const c = data.content as Record<string, any>;
          if (c.pulse_feed_label) setFeedLabel(c.pulse_feed_label);
        }
      });

    const fetchAll = async () => {
      const activities: ActivityItem[] = [];

      // --- Matchmaking highlight (pinned first) ---
      if (user) {
        const { count } = await supabase
          .from("player_selections")
          .select("*", { count: "exact", head: true });
        const playerCount = count || 0;

        const { data: recentBooking } = await supabase
          .from("bookings")
          .select("full_name, activity_name, created_at")
          .order("created_at", { ascending: false })
          .limit(1);

        const hour = new Date().getHours();
        const timeOfDay = hour < 12 ? "this morning" : hour < 17 ? "this afternoon" : "tonight";

        if (recentBooking && recentBooking.length > 0) {
          const firstName = recentBooking[0].full_name?.split(" ")[0] || "Someone";
          activities.push({
            id: "match-highlight",
            text: `🏀 ${firstName} is playing ${recentBooking[0].activity_name} near you ${timeOfDay}`,
            initials: "⚡",
            time: playerCount > 1 ? `${playerCount} players nearby` : "Find a match",
            highlight: true,
            link: "/matchmaker",
          });
        } else if (playerCount > 0) {
          activities.push({
            id: "match-highlight",
            text: `${playerCount} player${playerCount !== 1 ? "s" : ""} looking for a match ${timeOfDay}`,
            initials: "⚡",
            time: "Find a match",
            highlight: true,
            link: "/matchmaker",
          });
        }
      }

      // --- Recent bookings ---
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, full_name, activity_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (bookings) {
        for (const b of bookings) {
          const first = (b.full_name || "?").charAt(0).toUpperCase();
          activities.push({
            id: b.id,
            text: `${b.full_name?.split(" ")[0] || "Someone"} just booked ${b.activity_name}`,
            initials: first,
            time: formatDistanceToNowStrict(parseISO(b.created_at), { addSuffix: true }),
          });
        }
      }

      // --- Recent badges ---
      const { data: badges } = await supabase
        .from("badge_point_assignments")
        .select("id, user_id, badge_level, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      if (badges && badges.length > 0) {
        const userIds = [...new Set(badges.map(b => b.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        const nameMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

        for (const b of badges) {
          const name = nameMap.get(b.user_id)?.split(" ")[0] || "Someone";
          activities.push({
            id: b.id,
            text: `${name} unlocked a Level ${b.badge_level} badge`,
            initials: name.charAt(0).toUpperCase(),
            time: formatDistanceToNowStrict(parseISO(b.created_at), { addSuffix: true }),
          });
        }
      }

      setItems(activities.slice(0, 8));
    };

    fetchAll();
  }, [user]);

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35, duration: 0.5 }}
      className="w-full max-w-sm lg:max-w-lg mx-auto"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
        </span>
        <span className="font-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">{feedLabel}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.05, duration: 0.4 }}
            className="shrink-0"
          >
            {item.highlight ? (
              <Link
                to={item.link || "/matchmaker"}
                className="group flex items-center gap-2.5 rounded-xl bg-primary/10 backdrop-blur-2xl px-3 py-2 min-w-[220px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] border border-primary/20 card-hover"
              >
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] shrink-0 glow-violet-subtle">
                  {item.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-foreground/90 truncate leading-tight">{item.text}</p>
                  <p className="text-[9px] text-primary/70 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-2.5 w-2.5" /> {item.time}
                    <ArrowRight className="h-2.5 w-2.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] backdrop-blur-2xl px-3 py-2 min-w-[200px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] card-hover">
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-[10px] font-bold shrink-0 glow-violet-subtle">
                  {item.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-foreground/80 truncate leading-tight">{item.text}</p>
                  <p className="text-[9px] text-muted-foreground/60">{item.time}</p>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default LiveActivityStrip;
