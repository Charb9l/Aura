import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface NearbyActivity {
  name: string;
  sport: string;
  location: string;
}

const MatchmakingSocialCard = () => {
  const { user } = useAuth();
  const [activity, setActivity] = useState<NearbyActivity | null>(null);
  const [playerCount, setPlayerCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      // Get recent player selections count (active matchmakers)
      const { count } = await supabase
        .from("player_selections")
        .select("*", { count: "exact", head: true });
      setPlayerCount(count || 0);

      // Get a recent booking with name for social proof
      const { data } = await supabase
        .from("bookings")
        .select("full_name, activity_name, created_at")
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const firstName = data[0].full_name?.split(" ")[0] || "Someone";
        setActivity({
          name: firstName,
          sport: data[0].activity_name,
          location: "near you",
        });
      }
    };
    fetch();
  }, [user]);

  if (!user || (playerCount === 0 && !activity)) return null;

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "this morning" : hour < 17 ? "this afternoon" : "tonight";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="w-full max-w-sm lg:max-w-lg mx-auto"
    >
      <div className="rounded-2xl border border-border bg-card/90 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {activity ? (
              <p className="text-sm text-foreground/90 leading-snug">
                🏀 <span className="text-primary font-medium">{activity.name}</span> is playing{" "}
                <span className="font-medium">{activity.sport}</span> {activity.location} {timeOfDay}
              </p>
            ) : (
              <p className="text-sm text-foreground/90 leading-snug">
                {playerCount} player{playerCount !== 1 ? "s" : ""} in your area are looking for a match {timeOfDay}.
              </p>
            )}
            {playerCount > 1 && activity && (
              <p className="text-[11px] text-muted-foreground mt-1">
                {playerCount - 1} other player{playerCount - 1 !== 1 ? "s" : ""} looking for a match {timeOfDay}
              </p>
            )}
          </div>
        </div>
        <Link to="/matchmaker">
          <Button size="sm" className="w-full gap-1.5 h-8 text-xs">
            View Matches <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

export default MatchmakingSocialCard;
