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
  const [feedLabel, setFeedLabel] = useState("Pulse Feed");

  useEffect(() => {
    // Load CMS label
    supabase.from("page_content").select("content").eq("page_slug", "home").maybeSingle()
      .then(({ data }) => {
        if (data?.content) {
          const c = data.content as Record<string, any>;
          if (c.pulse_feed_label) setFeedLabel(c.pulse_feed_label);
        }
      });

    const fetchRecent = async () => {
      const activities: ActivityItem[] = [];

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

      setItems(activities.slice(0, 6));
    };

    fetchRecent();
  }, []);

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35, duration: 0.5 }}
      className="w-full max-w-sm lg:max-w-lg mx-auto"
    >
      <div className="flex items-center gap-2 mb-2">
        {/* Breathing violet pulse dot */}
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
            className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] backdrop-blur-2xl px-3 py-2 shrink-0 min-w-[200px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] card-hover"
          >
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-[10px] font-bold shrink-0 glow-violet-subtle">
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
