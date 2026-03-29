import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Trophy, Flame, Check, Gift, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRewards } from "@/hooks/useRewards";
import { startOfWeek, subWeeks, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface OfferingItem {
  id: string;
  name: string;
  logo_url: string | null;
}

const DEFAULT_STEPS = [
  { title: "BOOK & EARN", desc: "Every session earns 1 point." },
  { title: "5 PTS → 50% OFF", desc: "Half price on your next booking." },
  { title: "10 PTS → FREE", desc: "Completely free booking." },
];

const LoyaltyPage = () => {
  const { user } = useAuth();
  const { rewards, loaded: rewardsLoaded } = useRewards();
  const [title, setTitle] = useState("Book More. Earn More.");
  const [subtitle, setSubtitle] = useState("Every booking earns you a point. Stack them up and unlock exclusive discounts — or go big and play for free.");
  const [tagline, setTagline] = useState("Summit Rewards Program");
  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const [ctaHeading, setCtaHeading] = useState("Ready to Start Earning?");
  const [ctaSubtitle, setCtaSubtitle] = useState("Sign up, book your first session, and watch your points grow.");
  const [milestone5, setMilestone5] = useState("50% Off");
  const [milestone10, setMilestone10] = useState("Free Session");
  const [offerings, setOfferings] = useState<OfferingItem[]>([]);
  const [streakWeeks, setStreakWeeks] = useState<boolean[]>([false, false, false]);
  const [streakTitle, setStreakTitle] = useState("Streak Bonus");
  const [streakDesc, setStreakDesc] = useState("Book 3 weeks straight → earn 2x points that week");
  const [streakSubtitle, setStreakSubtitle] = useState("Consistency is rewarded. Keep your streak alive!");

  useEffect(() => {
    const fetchData = async () => {
      const [contentRes, offeringsRes] = await Promise.all([
        supabase.from("page_content").select("content").eq("page_slug", "loyalty").maybeSingle(),
        supabase.from("offerings").select("id, name, logo_url").order("name"),
      ]);
      if (contentRes.data?.content) {
        const c = contentRes.data.content as any;
        if (c.title) setTitle(c.title);
        if (c.subtitle) setSubtitle(c.subtitle);
        if (c.tagline) setTagline(c.tagline);
        if (c.steps?.length) setSteps(c.steps);
        if (c.cta_heading) setCtaHeading(c.cta_heading);
        if (c.cta_subtitle) setCtaSubtitle(c.cta_subtitle);
        if (c.milestone_5) setMilestone5(c.milestone_5);
        if (c.milestone_10) setMilestone10(c.milestone_10);
        if (c.streak_title) setStreakTitle(c.streak_title);
        if (c.streak_desc) setStreakDesc(c.streak_desc);
        if (c.streak_subtitle) setStreakSubtitle(c.streak_subtitle);
      }
      if (offeringsRes.data) setOfferings(offeringsRes.data);
    };
    fetchData();
  }, []);

  // Calculate streak weeks
  useEffect(() => {
    if (!user) return;
    const calcStreak = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("booking_date")
        .eq("user_id", user.id)
        .eq("attendance_status", "show")
        .order("booking_date", { ascending: false });
      if (!data) return;

      const now = new Date();
      const weeks: boolean[] = [];
      for (let w = 0; w < 3; w++) {
        const weekStart = startOfWeek(subWeeks(now, 2 - w), { weekStartsOn: 1 });
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const hasBooking = data.some(b => {
          const d = parseISO(b.booking_date);
          return d >= weekStart && d <= weekEnd;
        });
        weeks.push(hasBooking);
      }
      setStreakWeeks(weeks);
    };
    calcStreak();
  }, [user]);

  // Clubs with points for per-club progress
  const clubsWithPoints = useMemo(() => {
    if (!rewardsLoaded) return [];
    return rewards.filter(r => r.points > 0).sort((a, b) => b.points - a.points);
  }, [rewards, rewardsLoaded]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      {/* Compact Banner */}
      <section className="relative page-offset-top pb-6 overflow-hidden">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-2xl p-5 sm:p-6 overflow-hidden relative"
          >
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-medium">{tagline}</span>
                <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground mt-0.5 -tracking-tight">
                  {title}
                </h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {steps.map((step, i) => (
                    <span key={i} className="text-[11px] text-muted-foreground">
                      <span className="text-primary font-medium">{step.title}</span> — {step.desc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Per-Club Loyalty Progress */}
      {user && rewardsLoaded && (
        <section className="border-t border-border/50">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-medium whitespace-nowrap">Your Progress</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
            </div>

            {clubsWithPoints.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-muted-foreground mb-4">No loyalty points yet. Book a session to start earning!</p>
                <Link to="/book">
                  <Button className="glow">Book Now <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
              </motion.div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {clubsWithPoints.map((club, idx) => {
                  const rawPoints = club.points;
                  const cyclePoints = rawPoints % 10;
                  const completedCycles = Math.floor(rawPoints / 10);
                  const at10 = cyclePoints === 0 && rawPoints > 0 && completedCycles > 0;
                  const countdownTo5 = cyclePoints < 5 ? 5 - cyclePoints : null;
                  const countdownTo10 = cyclePoints >= 5 && cyclePoints < 10 ? 10 - cyclePoints : null;

                  return (
                    <motion.div
                      key={club.clubId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-2xl p-5 overflow-hidden"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        {club.clubLogo ? (
                          <img
                            src={club.clubLogo}
                            alt={club.clubName}
                            className="w-10 h-10 rounded-lg object-contain bg-secondary p-1"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/15 text-primary font-bold text-sm shrink-0">
                            {club.clubName.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-heading font-bold text-foreground text-sm">{club.clubName}</p>
                          <p className="text-xs text-muted-foreground">{rawPoints} point{rawPoints !== 1 ? "s" : ""} earned</p>
                        </div>
                        {cyclePoints >= 5 && cyclePoints < 10 && (
                          <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                            <Gift className="h-3 w-3" /> 50% off!
                          </span>
                        )}
                        {(at10 || cyclePoints === 10) && (
                          <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-accent/10 text-accent">
                            <Zap className="h-3 w-3" /> FREE!
                          </span>
                        )}
                      </div>

                      {/* 10-stage tracker */}
                      <div className="flex items-center gap-1.5 mb-3">
                        {Array.from({ length: 10 }, (_, i) => {
                          const filled = i < cyclePoints;
                          const is5Mark = i === 4;
                          const is10Mark = i === 9;

                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1 + i * 0.03 }}
                                className={cn(
                                  "w-full h-8 rounded-md flex items-center justify-center text-[10px] font-bold transition-all",
                                  filled
                                    ? "bg-primary text-primary-foreground"
                                    : "border border-border text-muted-foreground/40"
                                )}
                              >
                                {is5Mark && !filled && <Gift className="h-3 w-3" />}
                                {is10Mark && !filled && <Zap className="h-3 w-3" />}
                                {filled && (i + 1)}
                                {!filled && !is5Mark && !is10Mark && (i + 1)}
                              </motion.div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Countdown text */}
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{cyclePoints}/10 this cycle</span>
                        {countdownTo5 && (
                          <span className="text-primary/70">{countdownTo5} more → {milestone5}</span>
                        )}
                        {countdownTo10 && (
                          <span className="text-primary font-medium">{countdownTo10} more → {milestone10}</span>
                        )}
                        {(at10 || cyclePoints >= 10) && (
                          <span className="text-accent font-medium">🎉 Reward unlocked!</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Streak Bonus */}
      {user && (
        <section className="border-t border-border/50">
          <div className="container mx-auto px-6 py-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-medium whitespace-nowrap">{streakTitle}</span>
                <div className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
              </div>

              <div className="max-w-lg mx-auto rounded-2xl border border-border/40 bg-card/50 backdrop-blur-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">{streakDesc}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{streakSubtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-center">
                  {["Week 1", "Week 2", "Week 3"].map((label, i) => {
                    const done = streakWeeks[i];
                    const isCurrent = !done && (i === 0 || streakWeeks[i - 1]);
                    return (
                      <div key={label} className="flex flex-col items-center gap-1.5">
                        <div
                          className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                            done
                              ? "border-primary bg-primary/15 text-primary"
                              : isCurrent
                              ? "border-primary/50 bg-primary/5 text-primary/60 animate-pulse"
                              : "border-border text-muted-foreground/40"
                          }`}
                        >
                          {done ? <Check className="h-5 w-5" /> : <span className="text-xs font-medium">{i + 1}</span>}
                        </div>
                        <span className={`text-[9px] uppercase tracking-wider ${done ? "text-primary" : "text-muted-foreground/60"}`}>
                          {done ? "✓" : isCurrent ? "Now" : label.split(" ")[1]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Activities marquee */}
      {offerings.length > 0 && (
        <section className="border-t border-border/50 py-12 overflow-hidden max-w-full">
          <div className="container mx-auto px-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-medium whitespace-nowrap">Every Activity Counts</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
            </div>
          </div>

          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />

            <motion.div
              className="flex gap-4 w-max"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: Math.max(offerings.length * 5, 20), repeat: Infinity, ease: "linear" }}
            >
              {[...offerings, ...offerings].map((a, i) => (
                <div
                  key={`${a.id}-${i}`}
                  className="flex items-center gap-4 border border-border/40 bg-card/50 px-6 py-4 shrink-0 hover:border-primary/30 transition-all duration-500 group"
                >
                  <div className="w-11 h-11 overflow-hidden bg-secondary/50 shrink-0 border border-border/30">
                    {a.logo_url ? (
                      <img src={a.logo_url} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Trophy className="h-4 w-4 text-primary/30" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] font-medium text-foreground whitespace-nowrap">{a.name}</p>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap tracking-wide">1 booking = 1 point</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA for non-logged-in users */}
      {!user && (
        <section className="border-t border-border/50">
          <div className="container mx-auto px-6 py-14 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading text-3xl md:text-5xl font-light text-foreground mb-4">
                {ctaHeading}
              </h2>
              <p className="text-muted-foreground text-sm font-light mb-10 max-w-md mx-auto">
                {ctaSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/auth">
                  <Button
                    variant="outline"
                    className="h-11 px-8 text-xs uppercase tracking-[0.2em] font-medium border-border/60 text-foreground hover:border-primary/50 hover:text-primary transition-all duration-500"
                  >
                    Create Account
                  </Button>
                </Link>
                <Link to="/book">
                  <Button className="h-11 px-8 text-xs uppercase tracking-[0.2em] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-500">
                    Book Now
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      <footer className="border-t border-border/30 py-10">
        <div className="container mx-auto px-6 text-center text-[11px] uppercase tracking-[0.25em] text-muted-foreground/40">
          © {new Date().getFullYear()} All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LoyaltyPage;