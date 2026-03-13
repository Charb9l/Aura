import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { CalendarIcon, Clock, CheckCircle2, User, Mail, Phone, Gift, Sparkles } from "lucide-react";
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
import { useRewards } from "@/hooks/useRewards";
import { Spinner } from "@/components/ui/spinner";
import FeaturedClubsStrip from "@/components/FeaturedClubsStrip";

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

const CYCLE_INTERVAL = 4000;

const getGridLayout = (count: number) => {
  if (count === 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-3";
  if (count === 4) return "grid-cols-2 md:grid-cols-4";
  if (count <= 6) return "grid-cols-3 grid-rows-2";
  if (count <= 9) return "grid-cols-3 grid-rows-3";
  return "grid-cols-3 md:grid-cols-6";
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
  const [clubs, setClubs] = useState<{ id: string; name: string; offerings: string[]; logo_url: string | null }[]>([]);
  const [clubLocations, setClubLocations] = useState<ClubLocation[]>([]);
  const [activityPrices, setActivityPrices] = useState<{ club_id: string; activity_slug: string; price: number; price_label: string | null; location_id: string | null }[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [pageTitle, setPageTitle] = useState("Book a Session");
  const [pageSubtitle, setPageSubtitle] = useState("Select your activity, date and time.");
  const [maxClubsGrid, setMaxClubsGrid] = useState(3);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { activeRewards, getRewardForClub, hasRewards } = useRewards();
  // Hero pictures
  const [heroPictures, setHeroPictures] = useState<{ image: string; alt: string }[]>([]);
  const [heroCycleIndex, setHeroCycleIndex] = useState(0);
  // Profile data fetched from DB
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  // User promotions (admin-assigned)
  const [activePromo, setActivePromo] = useState<{ id: string; discount_type: string; discount_value: number; remaining_uses: number } | null>(null);
  // Active price rules for the selected club
  const [activePriceRule, setActivePriceRule] = useState<{ id: string; discount_type: string; discount_value: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    setProfileEmail(user.email || "");
    const fetchProfile = async () => {
      const [profileRes, promoRes] = await Promise.all([
        supabase.from("profiles").select("full_name, phone").eq("user_id", user.id).single(),
        supabase.from("user_promotions").select("*").eq("user_id", user.id).gt("remaining_uses", 0).order("created_at", { ascending: true }).limit(1),
      ]);
      if (profileRes.data) {
        setProfileName(profileRes.data.full_name || user.user_metadata?.full_name || "");
        setProfilePhone(profileRes.data.phone || "");
      }
      if (promoRes.data && promoRes.data.length > 0) {
        const p = promoRes.data[0] as any;
        setActivePromo({ id: p.id, discount_type: p.discount_type, discount_value: p.discount_value, remaining_uses: p.remaining_uses });
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      const [offRes, clubRes, locRes, contentRes, pricesRes, heroRes] = await Promise.all([
        supabase.from("offerings").select("*").order("name"),
        supabase.from("clubs").select("id, name, offerings, published, logo_url").order("name"),
        supabase.from("club_locations").select("*").order("name"),
        supabase.from("page_content").select("content").eq("page_slug", "book").single(),
        supabase.from("club_activity_prices").select("*"),
        supabase.from("hero_pictures").select("id, image_url, display_order").eq("page_slug", "book").order("display_order"),
      ]);
      if (offRes.data) setOfferings(offRes.data as unknown as OfferingData[]);
      if (clubRes.data) setClubs((clubRes.data as any[]).filter(c => c.published !== false));
      if (locRes.data) setClubLocations(locRes.data as unknown as ClubLocation[]);
      if (pricesRes.data) setActivityPrices(pricesRes.data as any[]);
      if (contentRes.data) {
        const c = contentRes.data.content as any;
        if (c?.title) setPageTitle(c.title);
        if (c?.subtitle) setPageSubtitle(c.subtitle);
        if (c?.max_clubs_grid != null) setMaxClubsGrid(c.max_clubs_grid);
      }
      if (heroRes.data && heroRes.data.length > 0) {
        setHeroPictures(heroRes.data.map((p: any) => ({ image: p.image_url, alt: "Book" })));
      }
    };
    fetchData();
  }, []);

  // Hero picture cycling
  useEffect(() => {
    if (heroPictures.length <= 9) return;
    const timer = setInterval(() => {
      setHeroCycleIndex(prev => (prev + 1) % heroPictures.length);
    }, CYCLE_INTERVAL);
    return () => clearInterval(timer);
  }, [heroPictures.length]);

  const visibleHeroPics = useMemo(() => {
    if (heroPictures.length === 0) return [];
    if (heroPictures.length <= 9) return heroPictures;
    const windowSize = 6;
    return Array.from({ length: windowSize }, (_, i) => heroPictures[(heroCycleIndex + i) % heroPictures.length]);
  }, [heroPictures, heroCycleIndex]);

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

  // Build club+location combos for selection — one card per CLUB, not per location
  const clubLocationsForSelected = useMemo(() => {
    return matchingClubs.map(club => {
      const locs = clubLocations.filter(l => l.club_id === club.id).sort((a, b) => a.name.localeCompare(b.name));
      return { club, locations: locs };
    });
  }, [matchingClubs, clubLocations]);

  const selectedClubLocations = useMemo(() => {
    return clubLocationsForSelected.find(c => c.club.id === selectedClub)?.locations || [];
  }, [clubLocationsForSelected, selectedClub]);

  const handleSelectClub = (clubId: string) => {
    setSelectedClub(clubId);
    // Auto-select location if club has exactly one
    const locs = clubLocations.filter(l => l.club_id === clubId);
    setSelectedLocation(locs.length === 1 ? locs[0].id : "");
    setCourtType("");
    setDate(undefined);
    setSelectedTime("");
  };

  // Auto-select if only one club
  useEffect(() => {
    if (clubLocationsForSelected.length === 1) {
      const opt = clubLocationsForSelected[0];
      setSelectedClub(opt.club.id);
      setSelectedLocation(opt.locations.length === 1 ? opt.locations[0].id : "");
    } else if (clubLocationsForSelected.length === 0) {
      setSelectedClub("");
      setSelectedLocation("");
    }
  }, [clubLocationsForSelected]);

  const resolvedClubId = selectedClub || (matchingClubs.length === 1 ? matchingClubs[0].id : "");

  // Fetch active price rule for selected club
  useEffect(() => {
    if (!resolvedClubId) { setActivePriceRule(null); return; }
    const fetchPriceRule = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data: ruleClubs } = await supabase.from("price_rule_clubs").select("price_rule_id").eq("club_id", resolvedClubId);
      if (!ruleClubs || ruleClubs.length === 0) { setActivePriceRule(null); return; }
      const ruleIds = ruleClubs.map(rc => rc.price_rule_id);
      const { data: rules } = await supabase.from("price_rules").select("*").in("id", ruleIds).eq("active", true);
      if (!rules || rules.length === 0) { setActivePriceRule(null); return; }
      const validRule = (rules as any[]).find(r => {
        if (r.start_date && r.start_date > today) return false;
        if (r.end_date && r.end_date < today) return false;
        return true;
      });
      setActivePriceRule(validRule ? { id: validRule.id, discount_type: validRule.discount_type, discount_value: validRule.discount_value } : null);
    };
    fetchPriceRule();
  }, [resolvedClubId]);

  // Dynamic brand color from the selected offering
  const selectedOffering = offerings.find(o => o.slug === selectedActivity);
  const brand = makeBrandStyles(selectedOffering?.brand_color);

  // Get price for current selection from DB — club-level by default, optionally location-specific
  const getActivityPrice = (slug: string, label?: string | null): number | null => {
    if (!resolvedClubId) return null;

    const wantedLabel = label || null;
    const candidates = activityPrices.filter(
      (p) =>
        p.club_id === resolvedClubId &&
        p.activity_slug === slug &&
        p.price_label === wantedLabel
    );

    // Prefer location-specific price if the user selected a location
    if (selectedLocation) {
      const byLocation = candidates.find((p) => p.location_id === selectedLocation);
      if (byLocation) return Number(byLocation.price);
    }

    // Fall back to club-level price (location_id is NULL)
    const clubLevel = candidates.find((p) => p.location_id == null);
    if (clubLevel) return Number(clubLevel.price);

    // Last resort: if only location-specific prices exist, return the first one
    return candidates.length ? Number(candidates[0].price) : null;
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

    // Determine discount: stacking logic
    // - If loyalty = FREE → overrides everything, price rule NOT consumed
    // - If loyalty = 50% AND price rule exists → both consumed, result = FREE
    // - If loyalty = 50% only → 50%
    // - If price rule only → apply price rule discount
    // - If admin promo only → apply admin promo
    let discountType: string | null = null;
    const clubReward = resolvedClubId ? getRewardForClub(resolvedClubId) : undefined;
    let consumePromo = false;
    let consumePriceRule = false;

    if (clubReward?.reward === "free") {
      // FREE loyalty overrides everything — price rule NOT consumed
      discountType = "free";
    } else if (clubReward?.reward === "50%" && activePriceRule) {
      // Both loyalty 50% + price rule stack → result is FREE, both consumed
      discountType = "free";
      consumePriceRule = true;
    } else if (clubReward?.reward === "50%") {
      discountType = "50%";
    } else if (activePriceRule) {
      // Price rule only
      if (activePriceRule.discount_type === "free") discountType = "free";
      else if (activePriceRule.discount_type === "percentage") {
        discountType = activePriceRule.discount_value >= 100 ? "free" : "50%";
      } else {
        discountType = "50%";
      }
      consumePriceRule = true;
    } else if (activePromo) {
      // Admin-assigned promotion
      if (activePromo.discount_type === "free") discountType = "free";
      else if (activePromo.discount_type === "percentage") {
        discountType = activePromo.discount_value >= 100 ? "free" : "50%";
      } else if (activePromo.discount_type === "fixed") {
        discountType = "50%";
      }
      consumePromo = true;
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
      price: currentPrice,
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

      // Decrement admin promo uses if consumed
      if (consumePromo && activePromo) {
        const newUses = activePromo.remaining_uses - 1;
        await supabase.from("user_promotions").update({ remaining_uses: newUses } as any).eq("id", activePromo.id);
        if (newUses <= 0) setActivePromo(null);
        else setActivePromo({ ...activePromo, remaining_uses: newUses });
      }

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
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />

      {/* Hero section with dynamic grid background */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        {visibleHeroPics.length > 0 && (
          <div className={cn("absolute inset-0 grid pointer-events-none", getGridLayout(visibleHeroPics.length))}>
            <AnimatePresence mode="popLayout">
              {visibleHeroPics.map((pic, i) => (
                <motion.div
                  key={`${pic.image}-${i}-${heroCycleIndex}`}
                  className="relative overflow-hidden"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 1.2, delay: i * 0.08 }}
                >
                  <img
                    src={pic.image}
                    alt={pic.alt}
                    className={cn(
                      "h-full w-full object-cover saturate-[0.3] contrast-[1.1]",
                      visibleHeroPics.length === 1 && "saturate-[0.4]"
                    )}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-background/80 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 py-32 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-light text-foreground mb-3">{pageTitle}</h1>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-lg mx-auto">{pageSubtitle}</p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-6 pb-16">
        <FeaturedClubsStrip variant="compact" className="mb-6" />

        {/* Rewards Banner */}
        {user && hasRewards && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-heading font-bold text-foreground text-sm mb-1.5">🎉 You have rewards available!</p>
                  <div className="space-y-1">
                    {activeRewards.map(r => (
                      <p key={r.clubId} className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{r.reward === "free" ? "🆓 Free booking" : "💰 50% off"}</span>
                        {" "}at <span className="font-medium text-foreground">{r.clubName}</span>
                      </p>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-2">Select the club below to auto-apply your discount.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Admin Promotion Banner */}
        {user && activePromo && !hasRewards && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-heading font-bold text-foreground text-sm mb-1">🎁 You have a special promotion!</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {activePromo.discount_type === "free" ? "Free booking" : activePromo.discount_type === "percentage" ? `${activePromo.discount_value}% off` : `$${activePromo.discount_value} off`}
                    </span>
                    {" "}— valid for your next {activePromo.remaining_uses} booking{activePromo.remaining_uses > 1 ? "s" : ""}.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

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
            <div className="grid grid-cols-5 gap-2 sm:flex sm:flex-wrap sm:gap-3">
              {filteredOfferings.map((a, i) => {
                const isSelected = selectedActivity === a.slug;
                const aBrand = makeBrandStyles(a.brand_color);
                const c = a.brand_color || "220 14% 60%";
                return (
                  <motion.button
                    type="button"
                    key={a.slug}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => { setSelectedActivity(a.slug); setSelectedClub(""); setSelectedLocation(""); setCourtType(""); setDate(undefined); setSelectedTime(""); }}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 transition-all duration-300",
                      isSelected ? "scale-105" : "hover:scale-105"
                    )}
                  >
                    {/* Circle image */}
                    <div
                      className={cn(
                        "relative h-14 w-14 sm:h-20 sm:w-20 rounded-full overflow-hidden border-2 transition-all duration-300",
                        isSelected
                          ? "border-primary shadow-lg"
                          : "border-border/50 group-hover:border-muted-foreground/40"
                      )}
                      style={isSelected ? { boxShadow: `0 0 20px hsl(${c} / 0.4)`, borderColor: `hsl(${c})` } : undefined}
                    >
                      {a.logo_url ? (
                        <img
                          src={a.logo_url}
                          alt={a.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center">
                          <span className="text-lg font-heading font-bold text-muted-foreground">{a.name[0]}</span>
                        </div>
                      )}
                    </div>
                    {/* Label */}
                    <span
                      className={cn(
                        "text-[9px] sm:text-xs font-medium tracking-wide uppercase transition-colors max-w-[64px] sm:max-w-[80px] text-center leading-tight",
                        isSelected ? "text-foreground" : "text-muted-foreground/70 group-hover:text-muted-foreground"
                      )}
                      style={isSelected ? { color: `hsl(${c})` } : undefined}
                    >
                      {a.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {selectedActivity && clubLocationsForSelected.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <Label className="text-sm font-medium text-muted-foreground mb-4 block">Choose Club</Label>
              {clubLocationsForSelected.length <= maxClubsGrid ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl">
                  {clubLocationsForSelected.map((opt) => {
                    const isSelected = selectedClub === opt.club.id;
                    const c = selectedOffering?.brand_color || "220 14% 60%";
                    return (
                      <button
                        type="button"
                        key={opt.club.id}
                        onClick={() => handleSelectClub(opt.club.id)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                          isSelected ? "shadow-md" : "border-border hover:border-muted-foreground/50"
                        )}
                        style={isSelected ? { borderColor: `hsl(${c})`, backgroundColor: `hsl(${c} / 0.08)`, boxShadow: `0 0 18px hsl(${c} / 0.25)` } : undefined}
                      >
                        {opt.club.logo_url ? (
                          <img src={opt.club.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0 border border-border" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border text-muted-foreground font-heading font-bold text-sm">
                            {opt.club.name[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-heading font-semibold text-sm text-foreground truncate">{opt.club.name}</p>
                          {opt.locations.length === 1 && (
                            <p className="text-xs text-muted-foreground truncate">{opt.locations[0].name}, {opt.locations[0].location}</p>
                          )}
                          {opt.locations.length > 1 && (
                            <p className="text-xs text-muted-foreground truncate">{opt.locations.length} locations</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Select value={selectedClub} onValueChange={handleSelectClub}>
                  <SelectTrigger className="max-w-sm h-12 bg-secondary border-border" style={selectedClub ? brand.glowSm : undefined}>
                    <SelectValue placeholder="Select a club…" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border z-50">
                    {clubLocationsForSelected.map((opt) => (
                      <SelectItem key={opt.club.id} value={opt.club.id}>
                        <div className="flex items-center gap-2">
                          {opt.club.logo_url ? (
                            <img src={opt.club.logo_url} alt="" className="h-6 w-6 rounded object-cover shrink-0" />
                          ) : (
                            <div className="h-6 w-6 rounded bg-secondary flex items-center justify-center shrink-0 text-muted-foreground font-heading font-bold text-[10px]">
                              {opt.club.name[0]}
                            </div>
                          )}
                          <span className="font-heading font-medium text-sm">{opt.club.name}</span>
                          {opt.locations.length === 1 && (
                            <span className="text-xs text-muted-foreground ml-1">— {opt.locations[0].name}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </motion.div>
          )}
          {selectedActivity && clubLocationsForSelected.length === 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <Label className="text-sm font-medium text-muted-foreground mb-4 block">Club</Label>
              <div className="flex items-center gap-3 rounded-xl border-2 px-4 py-3 max-w-sm" style={brand.glowSm}>
                {clubLocationsForSelected[0].club.logo_url ? (
                  <img src={clubLocationsForSelected[0].club.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0 border border-border" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border text-muted-foreground font-heading font-bold text-sm">
                    {clubLocationsForSelected[0].club.name[0]}
                  </div>
                )}
                <div>
                  <p className="font-heading font-semibold text-sm text-foreground">{clubLocationsForSelected[0].club.name}</p>
                  {clubLocationsForSelected[0].locations.length === 1 && (
                    <p className="text-xs text-muted-foreground">{clubLocationsForSelected[0].locations[0].name}, {clubLocationsForSelected[0].locations[0].location}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Location picker — only if selected club has multiple locations */}
          {selectedClub && selectedClubLocations.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
              <Label className="text-sm font-medium text-muted-foreground mb-4 block">Choose Location</Label>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl">
                {selectedClubLocations.map((loc) => {
                  const isSelected = selectedLocation === loc.id;
                  const c = selectedOffering?.brand_color || "220 14% 60%";
                  return (
                    <button
                      type="button"
                      key={loc.id}
                      onClick={() => { setSelectedLocation(loc.id); setCourtType(""); setDate(undefined); setSelectedTime(""); }}
                      className={cn(
                        "rounded-xl border-2 px-4 py-3 text-left transition-all",
                        isSelected ? "shadow-md" : "border-border hover:border-muted-foreground/50"
                      )}
                      style={isSelected ? { borderColor: `hsl(${c})`, backgroundColor: `hsl(${c} / 0.08)`, boxShadow: `0 0 18px hsl(${c} / 0.25)` } : undefined}
                    >
                      <p className="font-heading font-semibold text-sm text-foreground">{loc.name}</p>
                      <p className="text-xs text-muted-foreground">{loc.location}</p>
                    </button>
                  );
                })}
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

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            {user ? (
              <Button type="submit" disabled={!selectedActivity || !date || !selectedTime || (selectedActivity === "basketball" && !courtType) || (matchingClubs.length > 1 && !selectedClub) || !selectedLocation || submitting} className="h-14 px-10 text-lg font-bold rounded-xl glow gap-2">
                {submitting && <Spinner size="sm" />}
                {submitting ? "Booking..." : "Confirm Booking"}
              </Button>
            ) : (
              <Button type="button" onClick={() => navigate("/auth")} className="h-14 px-10 text-lg font-bold rounded-xl glow">
                Sign In to Book a Session
              </Button>
            )}
            {currentPrice !== null && (() => {
              const clubReward = resolvedClubId ? getRewardForClub(resolvedClubId) : undefined;
              const loyaltyFree = clubReward?.reward === "free";
              const loyaltyHalf = clubReward?.reward === "50%";
              const isFree = loyaltyFree || (loyaltyHalf && !!activePriceRule);
              const isHalf = loyaltyHalf && !activePriceRule;
              const hasPromoDiscount = !isFree && !isHalf && (!!activePriceRule || !!activePromo);
              const discountedPrice = isHalf ? (currentPrice / 2).toFixed(0) : null;

              return (
                <div className={cn(
                  "flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 rounded-xl border px-4 sm:px-5 py-3 sm:py-2.5 backdrop-blur-sm order-first sm:order-last",
                  isFree ? "border-emerald-500/50 bg-emerald-500/10" : (isHalf || hasPromoDiscount) ? "border-amber-500/50 bg-amber-500/10" : "border-primary/30 bg-primary/5"
                )}>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Total Price</span>
                  {isFree ? (
                    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                      <span className="font-heading text-base sm:text-lg text-muted-foreground line-through">${currentPrice}</span>
                      <span className="font-heading text-xl sm:text-2xl font-black text-emerald-400 animate-pulse flex items-center gap-1">
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" /> FREE!
                      </span>
                    </div>
                  ) : isHalf ? (
                    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                      <span className="font-heading text-base sm:text-lg text-muted-foreground line-through">${currentPrice}</span>
                      <div className="flex items-center gap-1">
                        <span className="font-heading text-xl sm:text-2xl font-bold text-amber-400">${discountedPrice}</span>
                        <span className="text-xs font-bold text-amber-400 bg-amber-400/15 rounded-full px-2 py-0.5">50% OFF</span>
                      </div>
                    </div>
                  ) : activePriceRule ? (
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-lg text-muted-foreground line-through">${currentPrice}</span>
                      {activePriceRule.discount_type === "free" ? (
                        <span className="font-heading text-2xl font-black text-emerald-400 animate-pulse flex items-center gap-1">
                          <Sparkles className="h-5 w-5" /> FREE!
                        </span>
                      ) : (
                        <>
                          <span className="font-heading text-2xl font-bold text-amber-400">
                            ${activePriceRule.discount_type === "percentage" ? (currentPrice * (1 - activePriceRule.discount_value / 100)).toFixed(0) : Math.max(0, currentPrice - activePriceRule.discount_value).toFixed(0)}
                          </span>
                          <span className="text-xs font-bold text-amber-400 bg-amber-400/15 rounded-full px-2 py-0.5">
                            {activePriceRule.discount_type === "percentage" ? `${activePriceRule.discount_value}% OFF` : `$${activePriceRule.discount_value} OFF`}
                          </span>
                        </>
                      )}
                    </div>
                  ) : activePromo ? (
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-lg text-muted-foreground line-through">${currentPrice}</span>
                      {activePromo.discount_type === "free" ? (
                        <span className="font-heading text-2xl font-black text-emerald-400 animate-pulse flex items-center gap-1">
                          <Sparkles className="h-5 w-5" /> FREE!
                        </span>
                      ) : (
                        <>
                          <span className="font-heading text-2xl font-bold text-amber-400">
                            ${(currentPrice * (1 - activePromo.discount_value / 100)).toFixed(0)}
                          </span>
                          <span className="text-xs font-bold text-amber-400 bg-amber-400/15 rounded-full px-2 py-0.5">
                            {activePromo.discount_value}% OFF
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="font-heading text-xl sm:text-2xl font-bold text-primary">${currentPrice}</span>
                  )}
                </div>
              );
            })()}
          </motion.div>

          {/* Confirmation Dialog */}
          {user && (
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
                  {currentPrice !== null && (() => {
                    const clubReward = resolvedClubId ? getRewardForClub(resolvedClubId) : undefined;
                    const loyaltyFree = clubReward?.reward === "free";
                    const loyaltyHalf = clubReward?.reward === "50%";
                    const isFree = loyaltyFree || (loyaltyHalf && !!activePriceRule);
                    const isHalf = loyaltyHalf && !activePriceRule;
                    const discountedPrice = isHalf ? (currentPrice / 2).toFixed(0) : null;
                    return (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Price:</span>{" "}
                        {isFree ? (
                          <>
                            <span className="text-muted-foreground line-through mr-2">${currentPrice}</span>
                            <span className="font-black text-emerald-400">FREE! 🎉</span>
                          </>
                        ) : isHalf ? (
                          <>
                            <span className="text-muted-foreground line-through mr-2">${currentPrice}</span>
                            <span className="font-bold text-amber-400">${discountedPrice}</span>
                            <span className="ml-1 text-xs text-amber-400">(50% off)</span>
                          </>
                        ) : activePriceRule ? (
                          <>
                            <span className="text-muted-foreground line-through mr-2">${currentPrice}</span>
                            {activePriceRule.discount_type === "free" ? (
                              <span className="font-black text-emerald-400">FREE! 🎉</span>
                            ) : (
                              <>
                                <span className="font-bold text-amber-400">
                                  ${activePriceRule.discount_type === "percentage" ? (currentPrice * (1 - activePriceRule.discount_value / 100)).toFixed(0) : Math.max(0, currentPrice - activePriceRule.discount_value).toFixed(0)}
                                </span>
                                <span className="ml-1 text-xs text-amber-400">
                                  ({activePriceRule.discount_type === "percentage" ? `${activePriceRule.discount_value}%` : `$${activePriceRule.discount_value}`} off)
                                </span>
                              </>
                            )}
                          </>
                        ) : (
                          <span className="text-foreground font-bold">${currentPrice}</span>
                        )}
                      </p>
                    );
                  })()}
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
          )}
        </form>
      </div>
    </div>
  );
};

export default BookPage;
