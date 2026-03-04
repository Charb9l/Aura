import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { CalendarIcon, Clock, CheckCircle2, User, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import ActivityFilter from "@/components/ActivityFilter";
import PagePhotoStrip from "@/components/PagePhotoStrip";

interface OfferingData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string | null;
}

interface ClubLocation {
  id: string;
  club_id: string;
  name: string;
  location: string;
}

const activityOfferingKeywords: Record<string, string[]> = {
  basketball: ["basketball"],
  tennis: ["tennis"],
  pilates: ["pilates"],
  "aerial-yoga": ["yoga", "aerial"],
};

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
];

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/** Build inline style objects from an HSL brand_color string like "212 70% 55%" */
const makeBrandStyles = (brandColor: string | null | undefined) => {
  const c = brandColor || "220 14% 60%"; // fallback muted
  return {
    border: { borderColor: `hsl(${c})` },
    glow: { borderColor: `hsl(${c})`, boxShadow: `0 0 20px hsl(${c} / 0.3)` },
    glowSm: { borderColor: `hsl(${c})`, boxShadow: `0 0 12px hsl(${c} / 0.15)` },
    bg10: { borderColor: `hsl(${c})`, backgroundColor: `hsl(${c} / 0.1)`, color: `hsl(${c})`, boxShadow: `0 0 12px hsl(${c} / 0.3)` },
    selectedDay: `hsl(${c})`,
  };
};

const BookPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("activity") || "";

  const [offerings, setOfferings] = useState<OfferingData[]>([]);
  const [filterSlugs, setFilterSlugs] = useState<string[]>([]);
  const [filterLocation, setFilterLocation] = useState("");
  const [selectedActivity, setSelectedActivity] = useState(preselected);
  const [selectedClub, setSelectedClub] = useState("");
  const [courtType, setCourtType] = useState<"half" | "full" | "">("");
  const [date, setDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [clubs, setClubs] = useState<{ id: string; name: string; offerings: string[] }[]>([]);
  const [clubLocations, setClubLocations] = useState<ClubLocation[]>([]);
  const [activityPrices, setActivityPrices] = useState<{ club_id: string; activity_slug: string; price: number; price_label: string | null; location_id: string | null }[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [pageTitle, setPageTitle] = useState("Book a Session");
  const [pageSubtitle, setPageSubtitle] = useState("Select your activity, date and time.");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Profile data fetched from DB
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  useEffect(() => {
    if (!user) return;
    setProfileEmail(user.email || "");
    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("full_name, phone").eq("user_id", user.id).single();
      if (data) {
        setProfileName(data.full_name || user.user_metadata?.full_name || "");
        setProfilePhone(data.phone || "");
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      const [offRes, clubRes, locRes, contentRes, pricesRes] = await Promise.all([
        supabase.from("offerings").select("*").order("name"),
        supabase.from("clubs").select("id, name, offerings, published").order("name"),
        supabase.from("club_locations").select("*").order("name"),
        supabase.from("page_content").select("content").eq("page_slug", "book").single(),
        supabase.from("club_activity_prices").select("*"),
      ]);
      if (offRes.data) setOfferings(offRes.data as unknown as OfferingData[]);
      if (clubRes.data) setClubs((clubRes.data as any[]).filter(c => c.published !== false));
      if (locRes.data) setClubLocations(locRes.data as unknown as ClubLocation[]);
      if (pricesRes.data) setActivityPrices(pricesRes.data as any[]);
      if (contentRes.data) {
        const c = contentRes.data.content as any;
        if (c?.title) setPageTitle(c.title);
        if (c?.subtitle) setPageSubtitle(c.subtitle);
      }
    };
    fetchData();
  }, []);

  const availableFilterLocations = useMemo(() => {
    const sportFiltered = filterSlugs.length > 0 ? offerings.filter(o => filterSlugs.includes(o.slug)) : offerings;
    const sportKeywords = sportFiltered.flatMap(o => activityOfferingKeywords[o.slug] || [o.slug]);
    const relevantClubIds = new Set(
      clubs.filter(c => c.offerings.some(o => sportKeywords.some(k => o.toLowerCase().includes(k)))).map(c => c.id)
    );
    const locs = clubLocations.filter(l => relevantClubIds.has(l.club_id));
    return Array.from(new Map(locs.map(l => [l.location, l])).values()).sort((a, b) => a.location.localeCompare(b.location));
  }, [filterSlugs, offerings, clubs, clubLocations]);

  useEffect(() => { setFilterLocation(""); }, [filterSlugs]);

  const filteredOfferings = useMemo(() => {
    let result = filterSlugs.length > 0 ? offerings.filter(o => filterSlugs.includes(o.slug)) : offerings;
    if (filterLocation && filterLocation !== "__all__") {
      const clubIdsAtLocation = new Set(clubLocations.filter(l => l.location === filterLocation).map(l => l.club_id));
      result = result.filter(o => {
        const keywords = activityOfferingKeywords[o.slug] || [o.slug];
        return clubs.some(c => clubIdsAtLocation.has(c.id) && c.offerings.some(off => keywords.some(k => off.toLowerCase().includes(k))));
      });
    }
    return result;
  }, [filterSlugs, filterLocation, offerings, clubs, clubLocations]);

  const matchingClubs = useMemo(() => {
    if (!selectedActivity) return [];
    const keywords = activityOfferingKeywords[selectedActivity] || [selectedActivity];
    return clubs.filter(c =>
      c.offerings.some(o => keywords.some(k => o.toLowerCase().includes(k)))
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedActivity, clubs]);

  useEffect(() => {
    if (matchingClubs.length === 1) {
      setSelectedClub(matchingClubs[0].id);
    } else if (matchingClubs.length === 0) {
      setSelectedClub("");
    }
  }, [matchingClubs]);

  const resolvedClubId = selectedClub || (matchingClubs.length === 1 ? matchingClubs[0].id : "");
  const locationsForClub = useMemo(() => {
    if (!resolvedClubId) return [];
    return clubLocations.filter(l => l.club_id === resolvedClubId).sort((a, b) => a.name.localeCompare(b.name));
  }, [resolvedClubId, clubLocations]);

  useEffect(() => {
    if (locationsForClub.length === 1) {
      setSelectedLocation(locationsForClub[0].id);
    } else if (locationsForClub.length === 0) {
      setSelectedLocation("");
    }
  }, [locationsForClub]);

  // Dynamic brand color from the selected offering
  const selectedOffering = offerings.find(o => o.slug === selectedActivity);
  const brand = makeBrandStyles(selectedOffering?.brand_color);

  // Get price for current selection from DB — now location-aware
  const getActivityPrice = (slug: string, label?: string | null): number | null => {
    if (!resolvedClubId || !selectedLocation) return null;
    const match = activityPrices.find(p =>
      p.club_id === resolvedClubId &&
      p.activity_slug === slug &&
      p.price_label === (label || null) &&
      p.location_id === selectedLocation
    );
    return match ? Number(match.price) : null;
  };
  const currentPrice = selectedActivity === "basketball"
    ? (courtType ? getActivityPrice("basketball", courtType) : null)
    : getActivityPrice(selectedActivity);

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

  const handleConfirmBooking = async () => {
    if (!user || !date) return;
    setSubmitting(true);
    setShowConfirmDialog(false);

    const offering = offerings.find(o => o.slug === selectedActivity);
    const activityName = offering?.name || selectedActivity;

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
      full_name: profileName,
      email: profileEmail,
      phone: profilePhone,
      court_type: selectedActivity === "basketball" ? courtType : null,
      discount_type: discountType,
    });

    setSubmitting(false);
    if (error) {
      toast.error("Booking failed: " + error.message);
    } else {
      supabase.functions.invoke("booking-confirmation-email", {
        body: {
          full_name: profileName,
          email: profileEmail,
          activity_name: activityName,
          booking_date: format(date, "PPP"),
          booking_time: selectedTime,
          court_type: selectedActivity === "basketball" ? courtType : null,
        },
      });

      setSubmitted(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmDialog(true);
  };

  if (submitted) {
    const offering = offerings.find(o => o.slug === selectedActivity);
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-6 pt-20">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <CheckCircle2 className="h-20 w-20 text-primary mx-auto mb-6" />
            <h1 className="font-heading text-2xl sm:text-4xl font-bold text-foreground mb-3">Booking Confirmed!</h1>
            <p className="text-muted-foreground text-lg mb-2">
              {offering?.name || selectedActivity} — {date && format(date, "PPP")} at {selectedTime}
            </p>
            <p className="text-muted-foreground">We'll send a confirmation to {profileEmail}</p>
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
          <h1 className="font-heading text-2xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">{pageTitle}</h1>
          <p className="text-muted-foreground text-lg mb-6">{pageSubtitle}</p>
        </motion.div>

        <PagePhotoStrip pageSlug="book" className="mb-10" />

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Activity selection */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <Label className="text-sm font-medium text-muted-foreground">Choose Activity</Label>
              <ActivityFilter offerings={offerings} selected={filterSlugs} onChange={setFilterSlugs} />
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger className="w-auto min-w-[160px] h-10 gap-2">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="__all__">All Locations</SelectItem>
                  {availableFilterLocations.map(loc => (
                    <SelectItem key={loc.id} value={loc.location}>{loc.location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filterLocation && filterLocation !== "__all__" && (
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setFilterLocation("")}>Clear location</Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {filteredOfferings.map((a) => {
                const isSelected = selectedActivity === a.slug;
                const aBrand = makeBrandStyles(a.brand_color);
                return (
                  <button
                    type="button"
                    key={a.slug}
                    onClick={() => { setSelectedActivity(a.slug); setSelectedClub(""); setSelectedLocation(""); setCourtType(""); setDate(undefined); setSelectedTime(""); }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-full border px-4 py-2 transition-all text-sm font-medium",
                      isSelected
                        ? "shadow-md"
                        : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground bg-secondary/30"
                    )}
                    style={isSelected ? aBrand.bg10 : undefined}
                  >
                    {a.logo_url && (
                      <img
                        src={a.logo_url}
                        alt=""
                        className="h-6 w-6 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    <span className="whitespace-nowrap">{a.name}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {selectedActivity && matchingClubs.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <Label className="text-sm font-medium text-muted-foreground mb-4 block">Choose Club</Label>
              <Select value={selectedClub} onValueChange={setSelectedClub}>
                <SelectTrigger className="w-full max-w-sm h-12" style={selectedClub ? brand.glowSm : undefined}>
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
                <SelectTrigger className="w-full max-w-sm h-12" style={selectedLocation ? brand.glowSm : undefined}>
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
              <div className="w-full max-w-sm h-12 flex items-center px-4 rounded-md border bg-secondary" style={brand.glowSm}>
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
                      courtType !== ct.value && "border-border hover:border-muted-foreground/50"
                    )}
                    style={courtType === ct.value ? { ...brand.glow, backgroundColor: `hsl(${selectedOffering?.brand_color || "30 80% 55%"} / 0.1)` } : undefined}
                  >
                    <span className="font-heading text-sm font-semibold text-foreground block">{ct.label}</span>
                    {(() => { const p = getActivityPrice("basketball", ct.value); return p !== null ? <span className="text-xs text-muted-foreground">${p}</span> : null; })()}
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
                    )}
                    style={date ? brand.glowSm : undefined}
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
                      day_selected: "text-white hover:text-white focus:text-white",
                    }}
                    styles={{
                      day_selected: { backgroundColor: brand.selectedDay, color: "white" },
                    } as any}
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
                            : selectedTime !== time
                              ? "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                              : ""
                      )}
                      style={selectedTime === time && !isBooked && selectedActivity ? brand.bg10 : undefined}
                    >
                      <Clock className="h-3 w-3" />
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-5">
            <Button type="submit" disabled={!selectedActivity || !date || !selectedTime || (selectedActivity === "basketball" && !courtType) || (matchingClubs.length > 1 && !selectedClub) || !selectedLocation || submitting} className="h-14 px-10 text-lg font-bold rounded-xl glow">
              {submitting ? "Booking..." : "Confirm Booking"}
            </Button>
            {currentPrice !== null && (
              <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-5 py-2.5 backdrop-blur-sm">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Total</span>
                <span className="font-heading text-2xl font-bold text-primary">${currentPrice}</span>
              </div>
            )}
          </motion.div>

          {/* Confirmation Dialog */}
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-heading">Confirm Your Booking</DialogTitle>
                <DialogDescription>Please review the details below before confirming.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Personal Info */}
                <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-2">
                  <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">Your Information</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground font-medium">{profileName || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{profileEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{profilePhone || "—"}</span>
                  </div>
                </div>
                {/* Booking Info */}
                <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-2">
                  <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">Booking Details</h4>
                  <p className="text-sm"><span className="text-muted-foreground">Activity:</span> <span className="text-foreground font-medium">{offerings.find(o => o.slug === selectedActivity)?.name}</span></p>
                  {resolvedClubId && <p className="text-sm"><span className="text-muted-foreground">Club:</span> <span className="text-foreground font-medium">{clubs.find(c => c.id === resolvedClubId)?.name}</span></p>}
                  {selectedLocation && <p className="text-sm"><span className="text-muted-foreground">Location:</span> <span className="text-foreground font-medium">{clubLocations.find(l => l.id === selectedLocation)?.name} — {clubLocations.find(l => l.id === selectedLocation)?.location}</span></p>}
                  {courtType && <p className="text-sm"><span className="text-muted-foreground">Court:</span> <span className="text-foreground font-medium">{courtType === "full" ? "Full Court" : "Half Court"}</span></p>}
                  <p className="text-sm"><span className="text-muted-foreground">Date:</span> <span className="text-foreground font-medium">{date && format(date, "PPP")}</span></p>
                  <p className="text-sm"><span className="text-muted-foreground">Time:</span> <span className="text-foreground font-medium">{selectedTime}</span></p>
                  {currentPrice !== null && <p className="text-sm"><span className="text-muted-foreground">Price:</span> <span className="text-foreground font-bold">${currentPrice}</span></p>}
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
                <Button onClick={handleConfirmBooking} disabled={submitting} className="glow">
                  {submitting ? "Booking..." : "Confirm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </>
          )}
        </form>
      </div>
    </div>
  );
};

export default BookPage;
