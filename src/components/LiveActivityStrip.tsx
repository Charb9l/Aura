import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNowStrict, parseISO } from "date-fns";

interface ActivityItem {
  id: string;
  text: string;
  initials: string;
  time: string;
}

const LiveActivityStrip = () => {
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      const activities: ActivityItem[] = [];

      // Recent bookings (public info only — activity name, no PII)
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

      // Recent badge achievements
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

      // Sort by recency (already mostly sorted, just interleave)
      setItems(activities.slice(0, 6));
    };

    fetchRecent();
  }, []);

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="w-full max-w-sm lg:max-w-lg mx-auto"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Live Activity</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + i * 0.08, duration: 0.4 }}
            className="flex items-center gap-2.5 rounded-xl bg-card/80 border border-border/60 px-3 py-2 shrink-0 min-w-[200px]"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
              {item.initials}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-foreground/80 truncate leading-tight">{item.text}</p>
              <p className="text-[9px] text-muted-foreground/60">{item.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default LiveActivityStrip;
