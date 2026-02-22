import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Calendar, Trophy, Star, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

// Loyalty tiers - placeholder until user defines the real program
const LOYALTY_TIERS = [
  { name: "Bronze", minBookings: 0, icon: "🥉" },
  { name: "Silver", minBookings: 5, icon: "🥈" },
  { name: "Gold", minBookings: 15, icon: "🥇" },
  { name: "Platinum", minBookings: 30, icon: "💎" },
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
  const currentTier = [...LOYALTY_TIERS].reverse().find(t => totalBookings >= t.minBookings) || LOYALTY_TIERS[0];
  const nextTier = LOYALTY_TIERS.find(t => t.minBookings > totalBookings);
  const bookingsToNext = nextTier ? nextTier.minBookings - totalBookings : 0;
  const progressPercent = nextTier
    ? ((totalBookings - currentTier.minBookings) / (nextTier.minBookings - currentTier.minBookings)) * 100
    : 100;

  // Activity breakdown
  const activityCounts = bookings.reduce((acc, b) => {
    acc[b.activity_name] = (acc[b.activity_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Loyalty Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 rounded-2xl border border-border bg-card p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="h-6 w-6 text-primary" />
              <h2 className="font-heading text-xl font-bold text-foreground">Loyalty Program</h2>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-5xl">{currentTier.icon}</span>
              <div>
                <p className="font-heading text-2xl font-bold text-foreground">{currentTier.name} Member</p>
                <p className="text-muted-foreground">{totalBookings} total booking{totalBookings !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {nextTier && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress to {nextTier.name}</span>
                  <span className="text-foreground font-medium">{bookingsToNext} booking{bookingsToNext !== 1 ? "s" : ""} to go</span>
                </div>
                <div className="h-3 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{currentTier.name}</span>
                  <span>{nextTier.name} {nextTier.icon}</span>
                </div>
              </div>
            )}

            {!nextTier && (
              <p className="text-primary font-medium flex items-center gap-2">
                <Star className="h-4 w-4" /> You've reached the highest tier! 🎉
              </p>
            )}
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Bookings</p>
              <p className="font-heading text-4xl font-bold text-foreground">{totalBookings}</p>
            </div>

            {Object.entries(activityCounts).length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground mb-3">By Activity</p>
                <div className="space-y-2">
                  {Object.entries(activityCounts).map(([name, count]) => (
                    <div key={name} className="flex justify-between items-center">
                      <span className="text-sm text-foreground">{name}</span>
                      <span className="text-sm font-bold text-primary">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link to="/book">
              <Button className="w-full h-12 rounded-xl glow font-bold">
                Book a Session <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10"
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
