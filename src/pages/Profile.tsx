import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, differenceInHours, isBefore, startOfDay } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Trophy, Star, Clock, ArrowRight, Gift, Zap, CalendarCheck, X, Pencil, Trash2, CalendarIcon } from "lucide-react";
import MyPlayerSection from "@/components/MyPlayerSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  activity: string;
  activity_name: string;
  booking_date: string;
  booking_time: string;
  status: string;
  created_at: string;
  court_type?: string | null;
  discount_type?: string | null;
  attendance_status?: string | null;
}

interface Profile {
  full_name: string | null;
  phone: string | null;
}

interface ClubInfo {
  id: string;
  name: string;
  logo_url: string | null;
  offerings: string[];
}

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
];

const getBookingDateTime = (booking: Booking): Date => {
  const [hours, minutes] = booking.booking_time.split(":").map(Number);
  const d = parseISO(booking.booking_date);
  d.setHours(hours, minutes || 0, 0, 0);
  return d;
};

const canDeleteBooking = (booking: Booking): boolean => {
  const bookingDt = getBookingDateTime(booking);
  const now = new Date();
  return differenceInHours(bookingDt, now) >= 2;
};

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clubs, setClubs] = useState<ClubInfo[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showPending, setShowPending] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editDate, setEditDate] = useState<Date>();
  const [editTime, setEditTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [bookingsRes, profileRes, clubsRes] = await Promise.all([
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
        supabase
          .from("clubs")
          .select("id, name, logo_url, offerings")
          .order("name"),
      ]);

      if (bookingsRes.data) setBookings(bookingsRes.data);
      if (profileRes.data) setProfile(profileRes.data);
      if (clubsRes.data) setClubs(clubsRes.data);
      setLoadingData(false);
    };

    fetchData();
  }, [user]);

  // Pending bookings = future bookings that are confirmed
  const pendingBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter(b => {
      const bookingDt = getBookingDateTime(b);
      return b.status === "confirmed" && bookingDt > now;
    }).sort((a, b) => {
      const dtA = getBookingDateTime(a);
      const dtB = getBookingDateTime(b);
      return dtA.getTime() - dtB.getTime();
    });
  }, [bookings]);

  // Fetch booked slots when editing
  useEffect(() => {
    if (!editingBooking || !editDate) {
      setBookedSlots([]);
      return;
    }
    const fetchSlots = async () => {
      const { data } = await supabase.rpc("get_booked_slots", {
        _activity: editingBooking.activity,
        _booking_date: format(editDate, "yyyy-MM-dd"),
      });
      // Exclude current booking's slot so user can keep their own time
      const slots = ((data as string[]) || []).filter(
        s => !(s === editingBooking.booking_time && format(editDate, "yyyy-MM-dd") === editingBooking.booking_date)
      );
      setBookedSlots(slots);
    };
    fetchSlots();
  }, [editingBooking, editDate]);

  const startEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setEditDate(parseISO(booking.booking_date));
    setEditTime(booking.booking_time);
  };

  const handleSaveEdit = async () => {
    if (!editingBooking || !editDate || !editTime) return;
    setSaving(true);

    const { error } = await supabase
      .from("bookings")
      .update({
        booking_date: format(editDate, "yyyy-MM-dd"),
        booking_time: editTime,
      })
      .eq("id", editingBooking.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to update booking: " + error.message);
    } else {
      toast.success("Booking updated!");
      setBookings(prev =>
        prev.map(b =>
          b.id === editingBooking.id
            ? { ...b, booking_date: format(editDate, "yyyy-MM-dd"), booking_time: editTime }
            : b
        )
      );
      setEditingBooking(null);
    }
  };

  const handleDelete = async (booking: Booking) => {
    if (!canDeleteBooking(booking)) return;

    const { error } = await supabase.from("bookings").delete().eq("id", booking.id);
    if (error) {
      toast.error("Failed to cancel booking: " + error.message);
    } else {
      toast.success("Booking cancelled.");
      setBookings(prev => prev.filter(b => b.id !== booking.id));
    }
  };

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

  const totalBookings = bookings.filter(b => b.attendance_status === "show").length;

  // Loyalty per club: count bookings whose activity slug is in the club's offerings
  const clubPoints: Record<string, number> = {};
  clubs.forEach(club => {
    const showCount = bookings.filter(b => club.offerings.includes(b.activity) && b.attendance_status === "show").length;
    const noShowCount = bookings.filter(b => club.offerings.includes(b.activity) && b.attendance_status === "no_show").length;
    clubPoints[club.id] = Math.max(0, showCount - noShowCount);
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

        {/* Pending Bookings Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <Button
            onClick={() => setShowPending(true)}
            variant="outline"
            className="h-14 px-6 rounded-xl font-bold text-base gap-3 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all"
          >
            <CalendarCheck className="h-5 w-5 text-primary" />
            Pending Bookings
            {pendingBookings.length > 0 && (
              <Badge className="ml-1 bg-primary text-primary-foreground text-xs px-2 py-0.5">
                {pendingBookings.length}
              </Badge>
            )}
          </Button>
        </motion.div>

        {/* MyPlayer Section */}
        <MyPlayerSection />

        {/* Pending Bookings Dialog */}
        <Dialog open={showPending} onOpenChange={setShowPending}>
          <DialogContent className="bg-card border-border max-w-3xl max-h-[66vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
                Pending Bookings
              </DialogTitle>
            </DialogHeader>

            {pendingBookings.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No upcoming bookings.</p>
                <Link to="/book" onClick={() => setShowPending(false)}>
                  <Button className="rounded-xl glow">Book a Session</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {pendingBookings.map((booking) => {
                  const deletable = canDeleteBooking(booking);
                  const bookingDt = getBookingDateTime(booking);
                  const hoursLeft = differenceInHours(bookingDt, new Date());

                  return (
                    <div
                      key={booking.id}
                      className="rounded-xl border border-border bg-secondary/30 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-heading font-semibold text-foreground">{booking.activity_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(booking.booking_date), "EEEE, MMMM d, yyyy")} at {booking.booking_time}
                          </p>
                          {booking.court_type && (
                            <p className="text-xs text-muted-foreground mt-0.5">{booking.court_type} court</p>
                          )}
                          {booking.discount_type && (
                            <Badge className={cn(
                              "mt-1 text-[10px]",
                              booking.discount_type === "free"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            )}>
                              {booking.discount_type === "free" ? "FREE" : "50% OFF"}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(booking)}
                            className="gap-1.5"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={!deletable}
                            onClick={() => handleDelete(booking)}
                            className="gap-1.5"
                            title={!deletable ? `Cannot cancel within 2 hours of booking time (${hoursLeft}h left)` : "Cancel booking"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Cancel
                          </Button>
                        </div>
                      </div>

                      {!deletable && (
                        <p className="text-xs text-destructive/70 mt-2">
                          Cannot cancel — less than 2 hours until booking time.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Booking Dialog */}
        <Dialog open={!!editingBooking} onOpenChange={(o) => !o && setEditingBooking(null)}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Edit Booking</DialogTitle>
            </DialogHeader>
            {editingBooking && (
              <div className="space-y-6 pt-2">
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="font-medium text-foreground">{editingBooking.activity_name}</p>
                  <p className="text-xs text-muted-foreground">Change date or time below</p>
                </div>

                {/* Date picker */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Date</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start h-12">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editDate ? format(editDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editDate}
                        onSelect={(d) => { if (d) { setEditDate(d); setEditTime(""); } }}
                        disabled={(d) => d < startOfDay(new Date())}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time slots */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Time</p>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map((time) => {
                      const isBooked = bookedSlots.includes(time);
                      return (
                        <button
                          type="button"
                          key={time}
                          onClick={() => !isBooked && setEditTime(time)}
                          disabled={isBooked}
                          className={cn(
                            "flex items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                            isBooked
                              ? "border-border bg-muted text-muted-foreground/40 cursor-not-allowed line-through"
                              : editTime === time
                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                          )}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  onClick={handleSaveEdit}
                  disabled={!editDate || !editTime || saving}
                  className="w-full h-12 font-bold rounded-xl glow"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

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
            {clubs.map((club, idx) => {
              const rawPoints = clubPoints[club.id] || 0;
              const cyclePoints = rawPoints % 10; // resets after 10
              const completedCycles = Math.floor(rawPoints / 10);
              const at10 = cyclePoints === 0 && rawPoints > 0 && completedCycles > 0;

              return (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + idx * 0.05 }}
                  className="rounded-2xl border border-border bg-card p-5 overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-4">
                    {club.logo_url ? (
                      <img
                        src={club.logo_url}
                        alt={club.name}
                        className="w-10 h-10 rounded-lg object-contain bg-secondary p-1"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/15 text-primary font-bold text-sm shrink-0">
                        {club.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-heading font-bold text-foreground text-sm">{club.name}</p>
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
            <p className="text-sm text-muted-foreground mb-3">By Club</p>
            <div className="space-y-2">
              {clubs.map(c => (
                <div key={c.id} className="flex justify-between items-center">
                  <span className="text-sm text-foreground">{c.name}</span>
                  <span className="text-sm font-bold text-primary">{clubPoints[c.id] || 0}</span>
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
                    booking.attendance_status === "show"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : booking.status === "confirmed"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {booking.attendance_status === "show" ? "Done" : booking.status}
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
