import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Trophy, Star, Clock, ArrowRight, Gift, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import tennisImg from "@/assets/tennis-court.png";
import basketballImg from "@/assets/basketball-court.png";
import yogaImg from "@/assets/aerial-yoga-studio.png";
import pilatesImg from "@/assets/pilates-studio.png";

interface Booking {
  id: string;
  activity: string;
  activity_name: string;
  booking_date: string;
  booking_time: string;
  status: string;
  created_at: string;
}

interface Profile {
  full_name: string | null;
  phone: string | null;
}

const ACTIVITIES = [
  { slug: "tennis", name: "Tennis", image: tennisImg, accent: "hsl(212 70% 55%)" },
  { slug: "basketball", name: "Basketball", image: basketballImg, accent: "hsl(262 50% 55%)" },
  { slug: "aerial-yoga", name: "Aerial Yoga", image: yogaImg, accent: "hsl(100 22% 60%)" },
  { slug: "pilates", name: "Pilates", image: pilatesImg, accent: "hsl(100 22% 60%)" },
];

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [bookingsRes, profileRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (bookingsRes.data) setBookings(bookingsRes.data);
      if (profileRes.data) setProfile(profileRes.data);
      setLoadingData(false);
    };

    fetchData();
  }, [user]);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const totalBookings = bookings.length;

  // Count bookings per activity (use modulo 10 for cycling rewards)
  const activityPoints: Record<string, number> = {};
  ACTIVITIES.forEach(a => {
    activityPoints[a.slug] = bookings.filter(b => b.activity === a.slug).length;
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-1">
            Hey, {profile?.full_name || user?.email} 👋
          </h1>
          <p className="text-muted-foreground text-lg">Your activity hub & loyalty progress.</p>
        </motion.div>

        {/* Loyalty Trackers — 4 activities, 10 stages each */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="h-6 w-6 text-primary" />
            <h2 className="font-heading text-xl font-bold text-foreground">Loyalty Progress</h2>
            <Link to="/loyalty" className="ml-auto text-sm text-primary hover:underline flex items-center gap-1">
              How it works <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {ACTIVITIES.map((activity, idx) => {
              const rawPoints = activityPoints[activity.slug] || 0;
              const cyclePoints = rawPoints % 10; // resets after 10
              const completedCycles = Math.floor(rawPoints / 10);
              const at5 = cyclePoints >= 5;
              const at10 = cyclePoints === 0 && rawPoints > 0 && completedCycles > 0;

              return (
                <motion.div
                  key={activity.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + idx * 0.05 }}
                  className="rounded-2xl border border-border bg-card p-5 overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={activity.image}
                      alt={activity.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-heading font-bold text-foreground text-sm">{activity.name}</p>
                      <p className="text-xs text-muted-foreground">{rawPoints} total booking{rawPoints !== 1 ? "s" : ""}</p>
                    </div>
                    {cyclePoints >= 5 && cyclePoints < 10 && (
                      <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                        <Gift className="h-3 w-3" /> 50% off available!
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
                            transition={{ delay: 0.2 + i * 0.03 }}
                            className={cn(
                              "w-full h-8 rounded-md flex items-center justify-center text-[10px] font-bold transition-all relative",
                              filled
                                ? "text-primary-foreground"
                                : "border border-border text-muted-foreground/40"
                            )}
                            style={filled ? { backgroundColor: activity.accent } : {}}
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

                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{cyclePoints}/10 this cycle</span>
                    <div className="flex gap-3">
                      <span className={cn(cyclePoints >= 5 ? "text-primary font-medium" : "")}>
                        5 = 50% off
                      </span>
                      <span className={cn(cyclePoints >= 10 || at10 ? "text-accent font-medium" : "")}>
                        10 = FREE
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick stats + Book button */}
        <div className="grid lg:grid-cols-3 gap-8 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <p className="text-sm text-muted-foreground mb-1">Total Bookings</p>
            <p className="font-heading text-4xl font-bold text-foreground">{totalBookings}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <p className="text-sm text-muted-foreground mb-3">By Activity</p>
            <div className="space-y-2">
              {ACTIVITIES.map(a => (
                <div key={a.slug} className="flex justify-between items-center">
                  <span className="text-sm text-foreground">{a.name}</span>
                  <span className="text-sm font-bold" style={{ color: a.accent }}>{activityPoints[a.slug] || 0}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-end"
          >
            <Link to="/book" className="w-full">
              <Button className="w-full h-14 rounded-xl glow font-bold text-lg">
                Book a Session <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" /> Recent Bookings
          </h2>

          {bookings.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-muted-foreground mb-4">No bookings yet. Start your journey!</p>
              <Link to="/book">
                <Button variant="outline" className="rounded-xl">Book Your First Session</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 10).map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-xl border border-border bg-card p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-heading font-semibold text-foreground">{booking.activity_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(booking.booking_date), "PPP")} at {booking.booking_time}
                    </p>
                  </div>
                  <span className={cn(
                    "text-xs font-medium px-3 py-1 rounded-full",
                    booking.status === "confirmed"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
