import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { CalendarIcon, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";

import tennisImg from "@/assets/tennis-court.png";
import basketballImg from "@/assets/basketball-court.png";
import yogaImg from "@/assets/aerial-yoga-studio.png";
import pilatesImg from "@/assets/pilates-studio.png";

const activities = [
  { slug: "tennis", name: "Tennis Court", image: tennisImg, brand: "tennis" as const },
  { slug: "basketball", name: "Basketball Court", image: basketballImg, brand: "basketball" as const },
  { slug: "aerial-yoga", name: "Aerial Yoga (Kids)", image: yogaImg, brand: "wellness" as const },
  { slug: "pilates", name: "Reformer Pilates", image: pilatesImg, brand: "wellness" as const },
];

const brandBorder = {
  tennis: "border-brand-tennis",
  basketball: "border-brand-basketball",
  wellness: "border-brand-wellness",
};

const brandGlow = {
  tennis: "shadow-[0_0_20px_hsl(212_70%_55%/0.3)]",
  basketball: "shadow-[0_0_20px_hsl(262_50%_55%/0.3)]",
  wellness: "shadow-[0_0_20px_hsl(100_22%_60%/0.3)]",
};

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
];

const BookPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("activity") || "";

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const [selectedActivity, setSelectedActivity] = useState(preselected);
  const [date, setDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedBrand = activities.find(a => a.slug === selectedActivity)?.brand;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date) return;
    setSubmitting(true);

    const activityName = activities.find(a => a.slug === selectedActivity)?.name || selectedActivity;

    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      activity: selectedActivity,
      activity_name: activityName,
      booking_date: format(date, "yyyy-MM-dd"),
      booking_time: selectedTime,
      full_name: name,
      email,
      phone,
    });

    setSubmitting(false);
    if (error) {
      toast.error("Booking failed: " + error.message);
    } else {
      // Also update profile phone if not set
      await supabase.from("profiles").update({ phone, full_name: name }).eq("user_id", user.id);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-6 pt-20">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <CheckCircle2 className="h-20 w-20 text-primary mx-auto mb-6" />
            <h1 className="font-heading text-4xl font-bold text-foreground mb-3">Booking Confirmed!</h1>
            <p className="text-muted-foreground text-lg mb-2">
              {activities.find(a => a.slug === selectedActivity)?.name} — {date && format(date, "PPP")} at {selectedTime}
            </p>
            <p className="text-muted-foreground">We'll send a confirmation to {email}</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-2">Book a Session</h1>
          <p className="text-muted-foreground text-lg mb-10">Select your activity, date and time.</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="max-w-3xl space-y-10">
          {/* Activity selection */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Label className="text-sm font-medium text-muted-foreground mb-4 block">Choose Activity</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {activities.map((a) => (
                <button
                  type="button"
                  key={a.slug}
                  onClick={() => setSelectedActivity(a.slug)}
                  className={cn(
                    "relative overflow-hidden rounded-xl border-2 transition-all aspect-[3/4]",
                    selectedActivity === a.slug
                      ? cn(brandBorder[a.brand], brandGlow[a.brand])
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <img src={a.image} alt={a.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                  <span className="absolute bottom-3 left-3 right-3 font-heading text-sm font-semibold text-foreground">
                    {a.name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Date & Time */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid md:grid-cols-2 gap-8">
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-4 block">Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-12", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < new Date()} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-4 block">Select Time</Label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((time) => (
                  <button
                    type="button"
                    key={time}
                    onClick={() => selectedActivity && setSelectedTime(time)}
                    disabled={!selectedActivity}
                    className={cn(
                      "flex items-center justify-center gap-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                      !selectedActivity
                        ? "border-border text-muted-foreground/40 cursor-not-allowed opacity-50"
                        : selectedTime === time
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
            <Label className="text-sm font-medium text-muted-foreground mb-4 block">Your Details</Label>
            <div className="grid md:grid-cols-3 gap-4">
              <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required className="h-12 bg-secondary border-border" />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 bg-secondary border-border" />
              <Input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required className="h-12 bg-secondary border-border" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Button type="submit" disabled={!selectedActivity || !date || !selectedTime || !name || !email || !phone || submitting} className="h-14 px-10 text-lg font-bold rounded-xl glow">
              {submitting ? "Booking..." : "Confirm Booking"}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default BookPage;
