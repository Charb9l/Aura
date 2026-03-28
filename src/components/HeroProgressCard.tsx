import { useAuth } from "@/contexts/AuthContext";
import { useRewards } from "@/hooks/useRewards";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const HeroProgressCard = () => {
  const { user } = useAuth();
  const { rewards, loaded } = useRewards();
  const [firstName, setFirstName] = useState("there");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data?.full_name) setFirstName(data.full_name.split(" ")[0]);
      });
  }, [user]);

  const bestClub = rewards
    .filter((r) => r.points > 0)
    .sort((a, b) => b.points - a.points)[0];

  let nudgeText: string;
  if (!bestClub || bestClub.points === 0) {
    nudgeText = "Book your first session to start earning rewards.";
  } else if (bestClub.points < 5) {
    const away = 5 - bestClub.points;
    nudgeText = `You're ${away} booking${away > 1 ? "s" : ""} away from 50% off at ${bestClub.clubName}.`;
  } else if (bestClub.points < 10) {
    const away = 10 - bestClub.points;
    nudgeText = `You're ${away} booking${away > 1 ? "s" : ""} away from a FREE session at ${bestClub.clubName}!`;
  } else {
    nudgeText = `You've unlocked a FREE session at ${bestClub.clubName}! 🎉`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className="w-full max-w-sm lg:max-w-lg mx-auto text-center relative"
    >
      {/* Mesh gradient behind greeting */}
      <div className="absolute inset-0 -mx-8 -my-4 mesh-gradient-purple opacity-60 rounded-3xl pointer-events-none" />
      <div className="relative z-10">
        <p className="text-lg sm:text-xl font-heading font-light text-foreground leading-snug -tracking-tight">
          {getGreeting()},{" "}
          <span className="text-primary font-semibold">{firstName}</span>
        </p>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed font-light">
          {nudgeText}
        </p>
      </div>
    </motion.div>
  );
};

export default HeroProgressCard;
