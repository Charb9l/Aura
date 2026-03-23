import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import MobileBackButton from "@/components/MobileBackButton";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, differenceInHours, startOfDay } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerProfileComplete } from "@/hooks/usePlayerProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAvatar, getInitials } from "@/hooks/useAvatar";
import { useBadgeLevels } from "@/hooks/useBadgeLevels";
import { useBadgePoints } from "@/hooks/useBadgePoints";
import { useNudges } from "@/hooks/useNudges";
import Navbar from "@/components/Navbar";
import { Trophy, Clock, ArrowRight, Gift, Zap, CalendarCheck, Pencil, Trash2, CalendarIcon, Camera, Send, Check, X as XIcon, Users, Phone, Gamepad2, Shield, Award, Crown, Bell } from "lucide-react";
import { useCustomerNotificationCount } from "@/hooks/useCustomerNotifications";
import CustomerNotificationsPanel from "@/components/CustomerNotificationsPanel";
import MyPlayerSection from "@/components/MyPlayerSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { findMatchingClubForBooking } from "@/lib/loyalty-club-match";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { isComplete: playerComplete } = usePlayerProfileComplete();
  const navigate = useNavigate();
  const { avatarUrl, setAvatarUrl } = useAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loyaltyAdjustments, setLoyaltyAdjustments] = useState<Record<string, number>>({});
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clubs, setClubs] = useState<ClubInfo[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showPending, setShowPending] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editDate, setEditDate] = useState<Date>();
  const [editTime, setEditTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showBadgeReward, setShowBadgeReward] = useState(false);
  const [selectedClubForPoint, setSelectedClubForPoint] = useState<string>("");
  const [assigningPoint, setAssigningPoint] = useState(false);
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);
  const [welcomeClub, setWelcomeClub] = useState("");
  const [assigningWelcome, setAssigningWelcome] = useState(false);
  const [viewNudge, setViewNudge] = useState<any | null>(null);
  const [respondingNudge, setRespondingNudge] = useState(false);
  const [showNudges, setShowNudges] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMyPlayer, setShowMyPlayer] = useState(searchParams.get("tab") === "myplayer");
  const [nudgeTab, setNudgeTab] = useState<"received" | "sent">("received");
  const [buddySportFilter, setBuddySportFilter] = useState<string>("");
  const [badgeFirstClicked, setBadgeFirstClicked] = useState(() => localStorage.getItem("badge_first_click_seen") === "true");
  const [showNotifications, setShowNotifications] = useState(false);
  // One-time welcome bonus banner: show only if never dismissed/completed
  const [welcomeBonusDismissed, setWelcomeBonusDismissed] = useState(() => localStorage.getItem("welcome_bonus_seen") === "true");
  const customerNotifCount = useCustomerNotificationCount();
  const badgeEmailSentRef = useRef<Set<number>>(new Set());

  // Nudges
  const { sentNudges, receivedNudges, buddies, respondToNudge, pendingReceivedCount } = useNudges();
  
  // Use persistent badge points
  const { assignments: badgeAssignments, assignedLevels, assignPoint: persistAssignPoint, refetch: refetchBadgePoints } = useBadgePoints();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }

    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadErr) { toast.error("Upload failed: " + uploadErr.message); setUploadingAvatar(false); return; }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl + "?t=" + Date.now();

    await supabase.from("profiles").update({ avatar_url: publicUrl } as any).eq("user_id", user.id);
    setAvatarUrl(publicUrl);
    setUploadingAvatar(false);
    toast.success("Profile photo updated!");
  };

  const initials = getInitials(user?.user_metadata?.full_name, user?.email);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [bookingsRes, profileRes, clubsRes, adjustmentsRes] = await Promise.all([
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
          .select("id, name, logo_url, offerings, published")
          .order("name"),
        supabase
          .from("loyalty_point_adjustments")
          .select("club_id, points")
          .eq("user_id", user.id),
      ]);

      if (bookingsRes.data) setBookings(bookingsRes.data);
      if (profileRes.data) setProfile(profileRes.data);
      if (clubsRes.data) setClubs((clubsRes.data as any[]).filter(c => c.published !== false));
      
      // Sum manual adjustments per club
      const adjMap: Record<string, number> = {};
      ((adjustmentsRes.data || []) as { club_id: string; points: number }[]).forEach(a => {
        adjMap[a.club_id] = (adjMap[a.club_id] || 0) + a.points;
      });
      setLoyaltyAdjustments(adjMap);
      
      setLoadingData(false);
    };

    fetchData();
  }, [user]);

  const [bookingsTab, setBookingsTab] = useState<"pending" | "past">("pending");

  // Pending bookings = confirmed, no attendance status
  const pendingBookings = useMemo(() => {
    return bookings.filter(b => {
      return b.status === "confirmed" && !b.attendance_status;
    }).sort((a, b) => {
      const dtA = getBookingDateTime(a);
      const dtB = getBookingDateTime(b);
      return dtA.getTime() - dtB.getTime();
    });
  }, [bookings]);

  // Past bookings = those with an attendance status
  const pastBookings = useMemo(() => {
    return bookings.filter(b => !!b.attendance_status).sort((a, b) => {
      const dtA = getBookingDateTime(a);
      const dtB = getBookingDateTime(b);
      return dtB.getTime() - dtA.getTime(); // newest first
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

  // Badge level completion using shared hook
  const { completedLevelCount: completedBadgeLevels } = useBadgeLevels(bookings);
  const availableBadgePoints = completedBadgeLevels - assignedLevels.size;

  // Send badge completion email when new level detected
  const BADGE_NAMES_LIST = ["Rookie", "Athlete", "Legend", "Champion", "Icon"];
  useEffect(() => {
    if (!user || completedBadgeLevels === 0 || !profile) return;
    // Check each completed level
    for (let lvl = 1; lvl <= completedBadgeLevels; lvl++) {
      const emailKey = `badge_email_sent_${user.id}_${lvl}`;
      if (localStorage.getItem(emailKey)) continue;
      if (badgeEmailSentRef.current.has(lvl)) continue;
      badgeEmailSentRef.current.add(lvl);
      localStorage.setItem(emailKey, "true");
      // Fire and forget
      supabase.functions.invoke("badge-completion-email", {
        body: {
          badge_name: BADGE_NAMES_LIST[lvl - 1] || `Level ${lvl}`,
          badge_level: lvl,
        },
      });
    }
  }, [user, completedBadgeLevels, profile]);

  // Find next unassigned level number
  const nextUnassignedLevel = useMemo(() => {
    for (let i = 1; i <= 5; i++) {
      if (!assignedLevels.has(i) && i <= completedBadgeLevels) return i;
    }
    return null;
  }, [assignedLevels, completedBadgeLevels]);

  // Auto-grant welcome bonus when both photo + MyPlayer are complete
  const welcomeBonusGrantedRef = useRef(false);
  useEffect(() => {
    if (welcomeBonusDismissed) return;
    if (!user || !avatarUrl || playerComplete !== true) return;
    if (welcomeBonusGrantedRef.current) return;
    welcomeBonusGrantedRef.current = true;
    // Both done — mark as seen so banner disappears forever
    setWelcomeBonusDismissed(true);
    localStorage.setItem("welcome_bonus_seen", "true");
    toast.success("🎉 Welcome bonus unlocked! Choose a club for your free loyalty point!");
    setShowWelcomeBonus(true);
  }, [avatarUrl, playerComplete, welcomeBonusDismissed, user]);

  const handleWelcomeBonusAssign = async () => {
    if (!welcomeClub || !user) return;
    setAssigningWelcome(true);
    const { error } = await supabase.from("loyalty_point_adjustments").insert({
      user_id: user.id,
      club_id: welcomeClub,
      points: 1,
      reason: "Welcome bonus: profile photo + MyPlayer setup",
    });
    setAssigningWelcome(false);
    if (error) {
      toast.error("Failed to assign point: " + error.message);
    } else {
      const clubName = clubs.find(c => c.id === welcomeClub)?.name;
      toast.success(`+1 loyalty point added to ${clubName}!`);
      setLoyaltyAdjustments(prev => ({ ...prev, [welcomeClub]: (prev[welcomeClub] || 0) + 1 }));
      setShowWelcomeBonus(false);
      setWelcomeClub("");
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

  // Loyalty per club: each booking attributed to exactly ONE club (first alphabetically if multiple match)
  const clubPoints: Record<string, number> = {};
  clubs.forEach(club => { clubPoints[club.id] = 0; });

  bookings.forEach((b) => {
    if (b.attendance_status !== "show" && b.attendance_status !== "no_show") return;

    const club = findMatchingClubForBooking(clubs, {
      activity: b.activity,
      activity_name: b.activity_name,
    });

    if (!club) return;
    if (b.attendance_status === "show") clubPoints[club.id] += 1;
    if (b.attendance_status === "no_show") clubPoints[club.id] -= 1;
  });

  Object.keys(clubPoints).forEach((clubId) => {
    clubPoints[clubId] = Math.max(0, clubPoints[clubId]);
  });

  // Helper: map booking activity to club name
  const getClubForBooking = (b: Booking): string => {
    const matchedClub = findMatchingClubForBooking(clubs, {
      activity: b.activity,
      activity_name: b.activity_name,
    });
    return matchedClub?.name || b.activity_name;
  };

  const handleAssignPoint = async () => {
    if (!selectedClubForPoint || availableBadgePoints <= 0 || !nextUnassignedLevel) return;
    setAssigningPoint(true);
    const success = await persistAssignPoint(selectedClubForPoint, nextUnassignedLevel);
    setAssigningPoint(false);
    if (success) {
      const clubName = clubs.find(c => c.id === selectedClubForPoint)?.name;
      toast.success(`+1 free loyalty point added to ${clubName}!`);
      setSelectedClubForPoint("");
      if (availableBadgePoints <= 1) setShowBadgeReward(false);
    } else {
      toast.error("Failed to assign point. You may have already assigned this level's point.");
    }
  };

  // Add badge points to club totals
  const badgePointsByClub: Record<string, number> = {};
  badgeAssignments.forEach(a => {
    badgePointsByClub[a.club_id] = (badgePointsByClub[a.club_id] || 0) + 1;
  });
  const effectiveClubPoints: Record<string, number> = {};
  clubs.forEach(club => {
    effectiveClubPoints[club.id] = (clubPoints[club.id] || 0) + (badgePointsByClub[club.id] || 0) + (loyaltyAdjustments[club.id] || 0);
  });

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-16">
        <MobileBackButton fallbackPath="/" />
        {/* Header with Avatar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex items-center gap-4 sm:gap-5">
          {/* Avatar */}
          <div className={cn("relative group shrink-0", !avatarUrl && "animate-pulse")}>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover border-2 border-border" />
            ) : (
              <>
                <div className="h-20 w-20 rounded-full bg-primary/20 text-primary font-bold text-2xl flex items-center justify-center border-2 border-primary/50 shadow-[0_0_15px_hsl(var(--primary)/0.4)]">
                  {initials}
                </div>
                <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-primary border-2 border-background animate-ping" />
                <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-primary border-2 border-background" />
              </>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className={cn(
                "absolute inset-0 rounded-full bg-background/60 transition-opacity flex items-center justify-center",
                avatarUrl ? "opacity-0 active:opacity-100 sm:group-hover:opacity-100" : "opacity-100"
              )}
            >
              <Camera className="h-5 w-5 text-foreground" />
            </button>
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-background/70 flex items-center justify-center">
                <Spinner size="sm" className="text-primary" />
              </div>
            )}
          </div>
          <div>
            <h1 className="font-heading text-xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1">
              Hey, {profile?.full_name || user?.email} 👋
            </h1>
            <p className="text-muted-foreground text-lg">Your activity hub & loyalty progress.</p>
          </div>
        </motion.div>

        {/* One-time welcome bonus banner */}
        <AnimatePresence>
          {!welcomeBonusDismissed && (!avatarUrl || playerComplete === false) && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-6 rounded-2xl border border-primary/40 bg-primary/5 p-4 sm:p-5 relative overflow-hidden"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-sm text-foreground mb-1">Welcome Bonus 🎉</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Upload a profile photo and set up your MyPlayer profile to earn <span className="font-bold text-primary">+1 free loyalty point</span> — redeemable at any club!
                  </p>
                  <div className="flex items-center gap-3 mt-2.5">
                    <span className={cn("text-xs font-medium flex items-center gap-1", avatarUrl ? "text-primary" : "text-muted-foreground")}>
                      {avatarUrl ? <Check className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
                      Photo
                    </span>
                    <span className={cn("text-xs font-medium flex items-center gap-1", playerComplete ? "text-primary" : "text-muted-foreground")}>
                      {playerComplete ? <Check className="h-3.5 w-3.5" /> : <Gamepad2 className="h-3.5 w-3.5" />}
                      MyPlayer
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => { setWelcomeBonusDismissed(true); localStorage.setItem("welcome_bonus_seen", "true"); }}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Action Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2"
        >
          {/* Pending Bookings */}
          <button
            onClick={() => setShowPending(true)}
            className="group relative rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <CalendarCheck className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-xs text-foreground leading-tight">Bookings</p>
                <p className="text-[10px] text-muted-foreground">Upcoming</p>
              </div>
              {pendingBookings.length > 0 && (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-5">
                  {pendingBookings.length}
                </Badge>
              )}
            </div>
          </button>

          {/* Pending Nudges */}
          <button
            onClick={() => setShowNudges(true)}
            className="group relative rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-accent/40"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Send className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-xs text-foreground leading-tight">Nudges</p>
                <p className="text-[10px] text-muted-foreground">{sentNudges.length > 0 ? `${sentNudges.length} sent` : "Requests"}</p>
              </div>
              {pendingReceivedCount > 0 && (
                <Badge className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0 h-5 animate-pulse">
                  {pendingReceivedCount}
                </Badge>
              )}
            </div>
          </button>

          {/* MyPlayer */}
          <button
            onClick={() => setShowMyPlayer(true)}
            className={cn(
              "group relative rounded-xl border bg-card p-3 text-left transition-all hover:border-primary/40",
              playerComplete === false ? "border-primary/50 shadow-[0_0_10px_hsl(var(--primary)/0.2)]" : "border-border"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className={cn("h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0", playerComplete === false && "animate-pulse")}>
                <Gamepad2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-xs text-foreground leading-tight">MyPlayer</p>
                <p className="text-[10px] text-muted-foreground">{playerComplete === false ? "Set up now!" : "Profile"}</p>
              </div>
              {playerComplete === false && (
                <>
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-ping" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                </>
              )}
            </div>
          </button>

          {/* Notifications */}
          <button
            onClick={() => setShowNotifications(true)}
            className="group relative rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40"
          >
            <div className="flex items-center gap-2.5">
              <div className={cn("h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0", customerNotifCount > 0 && "animate-pulse")}>
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-xs text-foreground leading-tight">Notifications</p>
                <p className="text-[10px] text-muted-foreground">Updates</p>
              </div>
              {customerNotifCount > 0 && (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-5 animate-pulse">
                  {customerNotifCount}
                </Badge>
              )}
            </div>
          </button>
        </motion.div>

        <CustomerNotificationsPanel open={showNotifications} onClose={() => setShowNotifications(false)} />

        {/* MyPlayer Dialog (externally controlled) */}
        <MyPlayerSection externalOpen={showMyPlayer} onExternalOpenChange={setShowMyPlayer} />

        {/* Habit Tracker Badge */}
        {(() => {
          const BADGE_NAMES = [
            { name: "Rookie", icon: <Shield className="h-6 w-6" />, color: "text-primary", bg: "bg-primary/15", border: "border-primary/40", glow: "shadow-[0_0_20px_hsl(var(--primary)/0.5)]" },
            { name: "Athlete", icon: <Award className="h-6 w-6" />, color: "text-accent", bg: "bg-accent/15", border: "border-accent/40", glow: "shadow-[0_0_20px_hsl(var(--accent)/0.5)]" },
            { name: "Legend", icon: <Crown className="h-6 w-6" />, color: "text-amber-400", bg: "bg-amber-400/15", border: "border-amber-400/40", glow: "shadow-[0_0_20px_rgba(251,191,36,0.5)]" },
            { name: "Champion", icon: <Trophy className="h-6 w-6" />, color: "text-emerald-400", bg: "bg-emerald-400/15", border: "border-emerald-400/40", glow: "shadow-[0_0_20px_rgba(52,211,153,0.5)]" },
            { name: "Icon", icon: <Zap className="h-6 w-6" />, color: "text-rose-400", bg: "bg-rose-400/15", border: "border-rose-400/40", glow: "shadow-[0_0_20px_rgba(251,113,133,0.5)]" },
          ];
          const currentIdx = completedBadgeLevels - 1;
          const badge = currentIdx >= 0 ? BADGE_NAMES[Math.min(currentIdx, BADGE_NAMES.length - 1)] : null;
          const shouldGlow = availableBadgePoints > 0 && !badgeFirstClicked;
          const handleBadgeClick = () => {
            if (!badgeFirstClicked) {
              localStorage.setItem("badge_first_click_seen", "true");
              setBadgeFirstClicked(true);
            }
            if (availableBadgePoints > 0) {
              setShowBadgeReward(true);
            }
          };

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <Zap className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-lg font-bold text-foreground">Habit Tracker Badge</h2>
                <Link to="/habits" className="ml-auto text-sm text-primary hover:underline flex items-center gap-1">
                  View Habits <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <button
                onClick={handleBadgeClick}
                className={cn(
                  "w-full rounded-2xl border p-5 text-left transition-all",
                  badge ? `${badge.border} ${badge.bg}` : "border-border bg-card",
                  shouldGlow && badge ? `${badge.glow} animate-pulse` : "",
                  availableBadgePoints > 0 ? "cursor-pointer hover:scale-[1.01]" : "cursor-default"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-14 w-14 rounded-xl flex items-center justify-center border shrink-0",
                    badge ? `${badge.border} ${badge.color}` : "border-border bg-secondary/50 text-muted-foreground"
                  )}>
                    {badge ? badge.icon : <Shield className="h-6 w-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-heading font-bold text-lg", badge ? badge.color : "text-muted-foreground")}>
                      {badge ? badge.name : "No Badge Yet"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {badge
                        ? availableBadgePoints > 0
                          ? "🎉 Tap to claim your free loyalty point!"
                          : `Level ${completedBadgeLevels} completed`
                        : "Complete your first habit level to earn a badge"}
                    </p>
                  </div>
                  {availableBadgePoints > 0 && (
                    <div className="shrink-0">
                      <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/30 animate-bounce">
                        +{availableBadgePoints} Free
                      </Badge>
                    </div>
                  )}
                  {badge && availableBadgePoints === 0 && (
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", badge.bg)}>
                      <Check className={cn("h-4 w-4", badge.color)} />
                    </div>
                  )}
                </div>
              </button>
            </motion.div>
          );
        })()}

        {/* Workout Buddies */}
        {buddies.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-xl font-bold text-foreground">Workout Buddies</h2>
            </div>
            {/* Sport filter chips */}
            {(() => {
              const sportIds = [...new Set(buddies.map(b => b.sport_id))];
              const sports = sportIds.map(id => ({ id, name: buddies.find(b => b.sport_id === id)?.sport_name || "", color: buddies.find(b => b.sport_id === id)?.sport_brand_color }));
              return sports.length > 1 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  <button onClick={() => setBuddySportFilter("")} className={cn("rounded-full px-3 py-1.5 text-xs font-medium border transition-all", !buddySportFilter ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground")}>All</button>
                  {sports.map(s => (
                    <button key={s.id} onClick={() => setBuddySportFilter(buddySportFilter === s.id ? "" : s.id)} className={cn("rounded-full px-3 py-1.5 text-xs font-medium border transition-all", buddySportFilter === s.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground")}>{s.name}</button>
                  ))}
                </div>
              ) : null;
            })()}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {buddies.filter(b => !buddySportFilter || b.sport_id === buddySportFilter).map(buddy => (
                <div key={buddy.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {buddy.buddy_avatar ? (
                      <img src={buddy.buddy_avatar} alt="" className="h-9 w-9 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">{(buddy.buddy_name || "?")[0]}</div>
                    )}
                    <div>
                      <p className="font-medium text-foreground text-sm">{buddy.buddy_name}</p>
                      <p className="text-xs text-muted-foreground">{buddy.sport_name}</p>
                    </div>
                  </div>
                  {buddy.buddy_phone && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Phone className="h-3 w-3" /> {buddy.buddy_phone}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Nudges Dialog */}
        <Dialog open={showNudges} onOpenChange={setShowNudges}>
          <DialogContent className="bg-card border-border max-w-2xl w-[95vw] md:w-auto max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" /> Pending Nudges
              </DialogTitle>
            </DialogHeader>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setNudgeTab("received")} className={cn("rounded-full px-4 py-2 text-sm font-medium border transition-all", nudgeTab === "received" ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground")}>
                Received {receivedNudges.length > 0 && `(${receivedNudges.length})`}
              </button>
              <button onClick={() => setNudgeTab("sent")} className={cn("rounded-full px-4 py-2 text-sm font-medium border transition-all", nudgeTab === "sent" ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground")}>
                Sent {sentNudges.length > 0 && `(${sentNudges.length})`}
              </button>
            </div>

            {nudgeTab === "received" ? (
              receivedNudges.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending nudges received.</p>
              ) : (
                <div className="space-y-3">
                  {receivedNudges.map(nudge => (
                    <div key={nudge.id} className="rounded-xl border border-border bg-secondary/30 p-4 cursor-pointer hover:border-primary/30 transition-all" onClick={() => setViewNudge(nudge)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {nudge.sender_avatar ? (
                            <img src={nudge.sender_avatar} alt="" className="h-10 w-10 rounded-full object-cover border border-border" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">{(nudge.sender_name || "?")[0]}</div>
                          )}
                          <div>
                            <p className="font-medium text-foreground">{nudge.sender_name}</p>
                            <p className="text-xs text-muted-foreground">{nudge.sport_name} · {nudge.sender_level}{nudge.sender_playstyle ? ` · ${nudge.sender_playstyle}` : ""}</p>
                          </div>
                        </div>
                        <Badge className="bg-accent/15 text-accent border-accent/30">New</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              sentNudges.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending sent nudges.</p>
              ) : (
                <div className="space-y-3">
                  {sentNudges.map(nudge => (
                    <div key={nudge.id} className="rounded-xl border border-border bg-secondary/30 p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">{(nudge.receiver_name || "?")[0]}</div>
                        <div>
                          <p className="font-medium text-foreground">{nudge.receiver_name}</p>
                          <p className="text-xs text-muted-foreground">{nudge.sport_name} · Waiting for response</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </DialogContent>
        </Dialog>

        {/* View Nudge Detail Dialog */}
        <Dialog open={!!viewNudge} onOpenChange={(o) => !o && setViewNudge(null)}>
          <DialogContent className="bg-card border-border max-w-md">
            {viewNudge && (
              <div className="space-y-5 pt-2">
                <div className="text-center">
                  {viewNudge.sender_avatar ? (
                    <img src={viewNudge.sender_avatar} alt="" className="h-16 w-16 rounded-full object-cover border-2 border-border mx-auto mb-3" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center mx-auto mb-3">{(viewNudge.sender_name || "?")[0]}</div>
                  )}
                  <h3 className="font-heading text-xl font-bold text-foreground">{viewNudge.sender_name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{viewNudge.sport_name} · {viewNudge.sender_level}{viewNudge.sender_playstyle ? ` · ${viewNudge.sender_playstyle}` : ""}</p>
                </div>
                <div className="rounded-xl bg-secondary/50 border border-border p-4 text-center">
                  <p className="text-muted-foreground text-sm">
                    Do you wish to accept your new workout buddy's nudge? If yes, <span className="font-semibold text-foreground">your phone number will be visible to them</span>.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      setRespondingNudge(true);
                      await respondToNudge(viewNudge.id, false);
                      setRespondingNudge(false);
                      toast.success("Nudge declined");
                      setViewNudge(null);
                    }}
                    disabled={respondingNudge}
                    className="flex-1 gap-2"
                  >
                    <XIcon className="h-4 w-4" /> Decline
                  </Button>
                  <Button
                    onClick={async () => {
                      setRespondingNudge(true);
                      await respondToNudge(viewNudge.id, true);
                      setRespondingNudge(false);
                      toast.success("Nudge accepted! You're now workout buddies 🎉");
                      setViewNudge(null);
                    }}
                    disabled={respondingNudge}
                    className="flex-1 glow gap-2"
                  >
                    <Check className="h-4 w-4" /> {respondingNudge ? "..." : "Accept"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Pending Bookings Dialog */}
        <Dialog open={showPending} onOpenChange={setShowPending}>
          <DialogContent className="bg-card border-border max-w-3xl w-[95vw] md:w-auto max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
                Bookings
              </DialogTitle>
            </DialogHeader>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button onClick={() => setBookingsTab("pending")} className={cn("rounded-full px-4 py-2 text-sm font-medium border transition-all", bookingsTab === "pending" ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground")}>
                Pending {pendingBookings.length > 0 && `(${pendingBookings.length})`}
              </button>
              <button onClick={() => setBookingsTab("past")} className={cn("rounded-full px-4 py-2 text-sm font-medium border transition-all", bookingsTab === "past" ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground")}>
                Past {pastBookings.length > 0 && `(${pastBookings.length})`}
              </button>
            </div>

            {bookingsTab === "pending" ? (
              pendingBookings.length === 0 ? (
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
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
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
              )
            ) : (
              pastBookings.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No past bookings yet.</p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {pastBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-xl border border-border bg-secondary/30 p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-semibold text-foreground">{booking.activity_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(booking.booking_date), "EEEE, MMMM d, yyyy")} at {booking.booking_time}
                          </p>
                          {booking.court_type && (
                            <p className="text-xs text-muted-foreground mt-0.5">{booking.court_type} court</p>
                          )}
                        </div>
                        <Badge className={cn(
                          "text-[10px] shrink-0",
                          booking.attendance_status === "show"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-destructive/20 text-destructive border-destructive/30"
                        )}>
                          {booking.attendance_status === "show" ? "✓ Attended" : "✗ No Show"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )
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

        {/* Badge Reward Banner - hidden since badge card handles it */}

        {/* Badge Reward Dialog */}
        <Dialog open={showBadgeReward} onOpenChange={setShowBadgeReward}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl flex items-center gap-2">
                <Gift className="h-5 w-5 text-amber-400" /> Assign Free Loyalty Point
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                You have <span className="font-bold text-foreground">{availableBadgePoints}</span> free point{availableBadgePoints > 1 ? "s" : ""} from completing badge levels. Choose a club to add a point to:
              </p>
              <Select value={selectedClubForPoint} onValueChange={setSelectedClubForPoint}>
                <SelectTrigger className="h-12 bg-secondary border-border">
                  <SelectValue placeholder="Select a club..." />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map(club => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAssignPoint} disabled={!selectedClubForPoint || assigningPoint} className="w-full h-12 font-bold glow">
                {assigningPoint ? "Assigning..." : "Add +1 Point"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Welcome Bonus Dialog */}
        <Dialog open={showWelcomeBonus} onOpenChange={setShowWelcomeBonus}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" /> Welcome Bonus 🎉
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                You completed your profile setup! Choose a club to receive your <span className="font-bold text-primary">+1 free loyalty point</span>:
              </p>
              <Select value={welcomeClub} onValueChange={setWelcomeClub}>
                <SelectTrigger className="h-12 bg-secondary border-border">
                  <SelectValue placeholder="Select a club..." />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map(club => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleWelcomeBonusAssign} disabled={!welcomeClub || assigningWelcome} className="w-full h-12 font-bold glow">
                {assigningWelcome ? "Assigning..." : "Claim +1 Point"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Loyalty Trackers */}
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
              const rawPoints = effectiveClubPoints[club.id] || 0;
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
                  <span className="text-sm font-bold text-primary">{effectiveClubPoints[c.id] || 0}</span>
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
                  className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-heading font-semibold text-foreground">{getClubForBooking(booking)}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.activity_name} · {format(new Date(booking.booking_date), "PPP")} at {booking.booking_time}
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
