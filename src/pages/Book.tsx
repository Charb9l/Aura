import { useState, useEffect, useMemo } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import PhoneInput from "@/components/PhoneInput";
import ActivityFilter from "@/components/ActivityFilter";



interface OfferingData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface ClubLocation {
  id: string;
  club_id: string;
  name: string;
  location: string;
}

const brandForSlug = (slug: string): "tennis" | "basketball" | "wellness" => {
  if (slug === "tennis") return "tennis";
  if (slug === "basketball") return "basketball";
  return "wellness";
};

const activityOfferingKeywords: Record<string, string[]> = {
  basketball: ["basketball"],
  tennis: ["tennis"],
  pilates: ["pilates"],
  "aerial-yoga": ["yoga", "aerial"],
};

const brandBorder = {
  tennis: "border-brand-tennis",
  basketball: "border-brand-basketball",
  wellness: "border-brand-wellness",
};

const brandGlow = {
  tennis: "shadow-[0_0_20px_hsl(212_70%_55%/0.3)]",
  basketball: "shadow-[0_0_20px_hsl(25_90%_55%/0.3)]",
  wellness: "shadow-[0_0_20px_hsl(100_22%_60%/0.3)]",
};

const brandInputClass = {
  tennis: "border-brand-tennis/50 focus:border-brand-tennis shadow-[0_0_12px_hsl(212_70%_55%/0.15)]",
  basketball: "border-brand-basketball/50 focus:border-brand-basketball shadow-[0_0_12px_hsl(25_90%_55%/0.15)]",
  wellness: "border-brand-wellness/50 focus:border-brand-wellness shadow-[0_0_12px_hsl(100_22%_60%/0.15)]",
};

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
];

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const BookPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("activity") || "";

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const [offerings, setOfferings] = useState<OfferingData[]>([]);
  const [filterSlugs, setFilterSlugs] = useState<string[]>([]);
  const [selectedActivity, setSelectedActivity] = useState(preselected);
  const [selectedClub, setSelectedClub] = useState("");
  const [courtType, setCourtType] = useState<"half" | "full" | "">("");
  const [date, setDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [clubs, setClubs] = useState<{ id: string; name: string; offerings: string[] }[]>([]);
  const [clubLocations, setClubLocations] = useState<ClubLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");

  // Fetch offerings and clubs on mount
  useEffect(() => {
    const fetchData = async () => {
      const [offRes, clubRes, locRes] = await Promise.all([
        supabase.from("offerings").select("*").order("name"),
        supabase.from("clubs").select("id, name, offerings").order("name"),
        supabase.from("club_locations").select("*").order("name"),
      ]);
      if (offRes.data) setOfferings(offRes.data as unknown as OfferingData[]);
      if (clubRes.data) setClubs(clubRes.data as any[]);
      if (locRes.data) setClubLocations(locRes.data as unknown as ClubLocation[]);
    };
    fetchData();
  }, []);

  // Filter clubs that offer the selected activity
  const matchingClubs = useMemo(() => {
    if (!selectedActivity) return [];
    const keywords = activityOfferingKeywords[selectedActivity] || [selectedActivity];
    return clubs.filter(c =>
      c.offerings.some(o => keywords.some(k => o.toLowerCase().includes(k)))
    );
  }, [selectedActivity, clubs]);

  // Auto-select club if only one matches
  useEffect(() => {
    if (matchingClubs.length === 1) {
      setSelectedClub(matchingClubs[0].id);
    } else if (matchingClubs.length === 0) {
      setSelectedClub("");
    }
  }, [matchingClubs]);

  // Locations for the resolved club
  const resolvedClubId = selectedClub || (matchingClubs.length === 1 ? matchingClubs[0].id : "");
  const locationsForClub = useMemo(() => {
    if (!resolvedClubId) return [];
    return clubLocations.filter(l => l.club_id === resolvedClubId);
  }, [resolvedClubId, clubLocations]);

  // Auto-select if only one location
  useEffect(() => {
    if (locationsForClub.length === 1) {
      setSelectedLocation(locationsForClub[0].id);
    } else if (locationsForClub.length === 0) {
      setSelectedLocation("");
    }
  }, [locationsForClub]);

  const selectedBrand = selectedActivity ? brandForSlug(selectedActivity) : undefined;

  // Fetch booked time slots when activity or date changes
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!selectedActivity || !date) {
        setBookedSlots([]);
        return;
      }
      const { data } = await supabase.rpc("get_booked_slots", {
        _activity: selectedActivity,
        _booking_date: format(date, "yyyy-MM-dd"),
      });
      setBookedSlots((data as string[]) || []);
    };
    fetchBookedSlots();
  }, [selectedActivity, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date) return;
    setSubmitting(true);

    const offering = offerings.find(o => o.slug === selectedActivity);
    const activityName = offering?.name || selectedActivity;

    // Calculate loyalty discount
    let discountType: string | null = null;
    const [showRes, noShowRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("activity", selectedActivity)
        .eq("attendance_status", "show"),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("activity", selectedActivity)
        .eq("attendance_status", "no_show"),
    ]);

    const effectivePoints = Math.max(0, (showRes.count || 0) - (noShowRes.count || 0));
    const positionInCycle = effectivePoints % 10;
    if (positionInCycle === 9) {
      discountType = "free";
    } else if (positionInCycle === 4) {
      discountType = "50%";
    }

    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      activity: selectedActivity,
      activity_name: activityName,
      booking_date: format(date, "yyyy-MM-dd"),
      booking_time: selectedTime,
      full_name: name,
      email,
      phone,
      court_type: selectedActivity === "basketball" ? courtType : null,
      discount_type: discountType,
    });

    setSubmitting(false);
    if (error) {
      toast.error("Booking failed: " + error.message);
    } else {
      await supabase.from("profiles").update({ phone, full_name: name }).eq("user_id", user.id);

      supabase.functions.invoke("booking-confirmation-email", {
        body: {
          full_name: name,
          email,
          activity_name: activityName,
          booking_date: format(date, "PPP"),
          booking_time: selectedTime,
          court_type: selectedActivity === "basketball" ? courtType : null,
        },
      });

      setSubmitted(true);
    }
  };

  if (submitted) {
    const offering = offerings.find(o => o.slug === selectedActivity);
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-6 pt-20">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <CheckCircle2 className="h-20 w-20 text-primary mx-auto mb-6" />
            <h1 className="font-heading text-4xl font-bold text-foreground mb-3">Booking Confirmed!</h1>
            <p className="text-muted-foreground text-lg mb-2">
              {offering?.name || selectedActivity} — {date && format(date, "PPP")} at {selectedTime}
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

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Activity selection */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-4">
              <Label className="text-sm font-medium text-muted-foreground">Choose Activity</Label>
              <ActivityFilter offerings={offerings} selected={filterSlugs} onChange={setFilterSlugs} />
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {(filterSlugs.length > 0 ? offerings.filter(o => filterSlugs.includes(o.slug)) : offerings).map((a) => {
                const brand = brandForSlug(a.slug);
                const imgSrc = a.logo_url || "";
                return (
                  <button
                    type="button"
                    key={a.slug}
                    onClick={() => { setSelectedActivity(a.slug); setSelectedClub(""); setSelectedLocation(""); setCourtType(""); setDate(undefined); setSelectedTime(""); }}
                    className={cn(
                      "relative overflow-hidden rounded-xl border-2 transition-all aspect-[3/4]",
                      selectedActivity === a.slug
                        ? cn(brandBorder[brand], brandGlow[brand])
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    {imgSrc && <img src={imgSrc} alt={a.name} className="h-full w-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                    <span className="absolute bottom-3 left-3 right-3 font-heading text-sm font-semibold text-foreground">
                      {a.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Club selector */}
          {selectedActivity && matchingClubs.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <Label className="text-sm font-medium text-muted-foreground mb-4 block">Choose Club</Label>
              <Select value={selectedClub} onValueChange={setSelectedClub}>
                <SelectTrigger className={cn("w-full max-w-sm h-12", selectedClub && selectedBrand === "tennis" && "border-brand-tennis shadow-[0_0_12px_hsl(212_70%_55%/0.3)]", selectedClub && selectedBrand === "basketball" && "border-brand-basketball shadow-[0_0_12px_hsl(25_90%_55%/0.3)]", selectedClub && selectedBrand === "wellness" && "border-brand-wellness shadow-[0_0_12px_hsl(100_22%_60%/0.3)]")}>
                  <SelectValue placeholder="Select a club..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  {matchingClubs.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}

          {/* Location selector */}
          {selectedActivity && resolvedClubId && locationsForClub.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
              <Label className="text-sm font-medium text-muted-foreground mb-4 block">Choose Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className={cn("w-full max-w-sm h-12", selectedLocation && selectedBrand && brandInputClass[selectedBrand])}>
                  <SelectValue placeholder="Select a location..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  {locationsForClub.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name} — {loc.location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}
          {selectedActivity && resolvedClubId && locationsForClub.length === 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
              <Label className="text-sm font-medium text-muted-foreground mb-4 block">Location</Label>
              <div className={cn("w-full max-w-sm h-12 flex items-center px-4 rounded-md border bg-secondary", selectedBrand && brandInputClass[selectedBrand])}>
                <span className="text-foreground">{locationsForClub[0].name} — {locationsForClub[0].location}</span>
              </div>
            </motion.div>
          )}

          {selectedActivity === "basketball" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Label className="text-sm font-medium text-muted-foreground mb-4 block">Select Court Type</Label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                {([{ value: "half" as const, label: "Half Court" }, { value: "full" as const, label: "Full Court" }]).map((ct) => (
                  <button
                    type="button"
                    key={ct.value}
                    onClick={() => setCourtType(ct.value)}
                    className={cn(
                      "rounded-xl border-2 px-4 py-4 text-left transition-all",
                     courtType === ct.value
                        ? "border-brand-basketball shadow-[0_0_20px_hsl(25_90%_55%/0.3)] bg-brand-basketball/10"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <span className="font-heading text-sm font-semibold text-foreground block">{ct.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Date & Time */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid md:grid-cols-2 gap-8">
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-4 block">Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!selectedActivity}
                    className={cn(
                      "w-full justify-start text-left font-normal h-12",
                      !selectedActivity && "opacity-50 cursor-not-allowed",
                      !date && "text-muted-foreground",
                      date && selectedBrand === "tennis" && "border-brand-tennis shadow-[0_0_12px_hsl(212_70%_55%/0.3)]",
                      date && selectedBrand === "basketball" && "border-brand-basketball shadow-[0_0_12px_hsl(25_90%_55%/0.3)]",
                      date && selectedBrand === "wellness" && "border-brand-wellness shadow-[0_0_12px_hsl(100_22%_60%/0.3)]",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => d < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    classNames={{
                      day_selected: cn(
                        "text-white hover:text-white focus:text-white",
                        selectedBrand === "tennis"
                          ? "bg-brand-tennis hover:bg-brand-tennis focus:bg-brand-tennis"
                          : selectedBrand === "wellness"
                            ? "bg-brand-wellness hover:bg-brand-wellness focus:bg-brand-wellness"
                            : "bg-brand-basketball hover:bg-brand-basketball focus:bg-brand-basketball"
                      ),
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-4 block">Select Time</Label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((time) => {
                  const isBooked = bookedSlots.includes(time);
                  return (
                    <button
                      type="button"
                      key={time}
                      onClick={() => selectedActivity && !isBooked && setSelectedTime(time)}
                      disabled={!selectedActivity || isBooked}
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                        isBooked
                          ? "border-border bg-muted text-muted-foreground/40 cursor-not-allowed opacity-50 line-through"
                          : !selectedActivity
                            ? "border-border text-muted-foreground/40 cursor-not-allowed opacity-50"
                            : selectedTime === time
                              ? selectedBrand === "tennis"
                                ? "border-brand-tennis bg-brand-tennis/10 text-brand-tennis shadow-[0_0_12px_hsl(212_70%_55%/0.3)]"
                                : selectedBrand === "wellness"
                                  ? "border-brand-wellness bg-brand-wellness/10 text-brand-wellness shadow-[0_0_12px_hsl(100_22%_60%/0.3)]"
                                  : "border-brand-basketball bg-brand-basketball/10 text-brand-basketball shadow-[0_0_12px_hsl(25_90%_55%/0.3)]"
                              : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                      )}
                    >
                      <Clock className="h-3 w-3" />
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Contact info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
            <Label className="text-sm font-medium text-muted-foreground mb-4 block">Your Details</Label>
            <div className="grid md:grid-cols-3 gap-4">
              <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required className={cn("h-12 bg-secondary border-border", selectedBrand && brandInputClass[selectedBrand])} />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={cn("h-12 bg-secondary border-border", selectedBrand && brandInputClass[selectedBrand])} />
              <PhoneInput value={phone} onChange={setPhone} required />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Button type="submit" disabled={!selectedActivity || !date || !selectedTime || !name || !email || !isValidEmail(email) || !phone || (selectedActivity === "basketball" && !courtType) || (matchingClubs.length > 1 && !selectedClub) || !selectedLocation || submitting} className="h-14 px-10 text-lg font-bold rounded-xl glow">
              {submitting ? "Booking..." : "Confirm Booking"}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default BookPage;
