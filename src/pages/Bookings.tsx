import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import MobileBackButton from "@/components/MobileBackButton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { findMatchingClubForBooking } from "@/lib/loyalty-club-match";

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

interface ClubInfo {
  id: string;
  name: string;
  logo_url: string | null;
  offerings: string[];
}

const BookingsPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clubs, setClubs] = useState<ClubInfo[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [bookingsRes, clubsRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("booking_date", { ascending: false }),
        supabase
          .from("clubs")
          .select("id, name, logo_url, offerings, published")
          .order("name"),
      ]);
      if (bookingsRes.data) setBookings(bookingsRes.data);
      if (clubsRes.data) setClubs((clubsRes.data as any[]).filter(c => c.published !== false));
      setLoadingData(false);
    };
    fetchData();
  }, [user]);

  const getClubForBooking = (b: Booking): string => {
    const matchedClub = findMatchingClubForBooking(clubs, {
      activity: b.activity,
      activity_name: b.activity_name,
    });
    return matchedClub?.name || b.activity_name;
  };

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const d = parseISO(b.booking_date);
      if (fromDate && d < startOfMonth(fromDate) && d < fromDate) {
        if (d < fromDate) return false;
      }
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });
  }, [bookings, fromDate, toDate]);

  const clearFilters = () => { setFromDate(undefined); setToDate(undefined); };

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

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <div className="container mx-auto px-6 page-offset-top pb-16 max-w-3xl">
        <MobileBackButton fallbackPath="/profile" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Clock className="h-6 w-6 text-muted-foreground" /> All Bookings
          </h1>

          {/* Date filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("rounded-xl text-sm gap-2", fromDate && "border-primary text-primary")}>
                  <CalendarIcon className="h-4 w-4" />
                  {fromDate ? format(fromDate, "MMM d, yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("rounded-xl text-sm gap-2", toDate && "border-primary text-primary")}>
                  <CalendarIcon className="h-4 w-4" />
                  {toDate ? format(toDate, "MMM d, yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {(fromDate || toDate) && (
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <X className="h-3 w-3" /> Clear
              </button>
            )}

            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} booking{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Bookings list */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-muted-foreground">No bookings found for the selected dates.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-heading font-semibold text-foreground">{getClubForBooking(booking)}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.activity_name} · {format(parseISO(booking.booking_date), "PPP")} at {booking.booking_time}
                    </p>
                    {booking.court_type && (
                      <p className="text-xs text-muted-foreground mt-0.5">{booking.court_type} court</p>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-medium px-3 py-1 rounded-full shrink-0",
                    booking.attendance_status === "show"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : booking.attendance_status === "no_show"
                        ? "bg-red-500/20 text-red-400"
                        : booking.status === "confirmed"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                  )}>
                    {booking.attendance_status === "show" ? "Done" : booking.attendance_status === "no_show" ? "No Show" : booking.status}
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

export default BookingsPage;
