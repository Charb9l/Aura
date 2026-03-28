import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Sparkles, MapPin, Trophy, Filter, Zap, Star, ArrowRight, Gauge, Swords, CalendarClock, Target, Send, ChevronRight, Camera, type LucideIcon } from "lucide-react";
import { MatchmakerIcon } from "@/components/icons/BrandIcons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { useNudges } from "@/hooks/useNudges";

interface MatchSport {
  sport_id: string;
  sport_name: string;
  sport_slug: string;
  brand_color: string | null;
  level_label: string;
  level_order: number;
  playstyle: string | null;
  location_name: string | null;
  location_area: string | null;
  match_quality: "perfect" | "good" | "sport-only";
  match_details: string[];
}

interface MatchProfile {
  user_id: string;
  display_name: string;
  sports: MatchSport[];
  best_match: "perfect" | "good" | "sport-only";
}

interface Offering {
  id: string;
  name: string;
  slug: string;
  brand_color: string | null;
}

interface Location {
  id: string;
  name: string;
  location: string;
}

const MATCH_BADGE = {
  perfect: { label: "Perfect Match", icon: Zap, color: "263 70% 58%", bg: "263 70% 58%" },
  good: { label: "Great Match", icon: Star, color: "270 60% 55%", bg: "270 60% 55%" },
  "sport-only": { label: "Same Sport", icon: Star, color: "240 60% 55%", bg: "240 60% 55%" },
};

const MatchmakerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [pageTitle, setPageTitle] = useState("Find Your Match");
  const [pageSubtitle, setPageSubtitle] = useState("Get matched with players who share your sports, skill level, and preferred location. Your next opponent or partner is just a click away.");
  const [criteria, setCriteria] = useState<{ emoji: string; label: string; use_gold?: boolean }[]>([]);
  const [avatarMap, setAvatarMap] = useState<Record<string, string | null>>({});
  const [activityMap, setActivityMap] = useState<Record<string, { active: boolean; lastActive: string }>>({});

  // Nudge state
  const { sendNudge, sentNudges } = useNudges();
  const [nudgeDialog, setNudgeDialog] = useState<{ match: MatchProfile; sport: MatchSport } | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase
        .from("page_content")
        .select("content")
        .eq("page_slug", "matchmaker")
        .maybeSingle();
      if (data?.content) {
        const c = data.content as Record<string, any>;
        if (c.title) setPageTitle(c.title);
        if (c.subtitle) setPageSubtitle(c.subtitle);
        if (Array.isArray(c.criteria)) setCriteria(c.criteria);
      }
    };
    fetchContent();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const checkProfile = async () => {
      const { count } = await supabase
        .from("player_selections")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setHasProfile((count ?? 0) >= 1);
    };
    checkProfile();
  }, [user]);

  useEffect(() => {
    if (!user || hasProfile === null || hasProfile === false) return;
    fetchMatches();
  }, [user, hasProfile, sportFilter, locationFilter]);

  const fetchMatches = async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (sportFilter) params.sport_id = sportFilter;
    if (locationFilter) params.location_id = locationFilter;

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "rzibwsrbizlsztmeznnr";
    const queryStr = new URLSearchParams(params).toString();
    const url = `https://${projectId}.supabase.co/functions/v1/find-matches${queryStr ? `?${queryStr}` : ""}`;

    const session = (await supabase.auth.getSession()).data.session;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    });

    const result = await res.json();
    const matchList: MatchProfile[] = result.matches || [];
    setMatches(matchList);
    if (result.offerings) setOfferings(result.offerings);
    if (result.locations) setLocations(result.locations);

    // Fetch avatars and activity for matched users
    if (matchList.length > 0) {
      const userIds = matchList.map(m => m.user_id);
      const [profilesRes, bookingsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, avatar_url").in("user_id", userIds),
        supabase.from("bookings").select("user_id, created_at").in("user_id", userIds).order("created_at", { ascending: false }),
      ]);
      const aMap: Record<string, string | null> = {};
      (profilesRes.data || []).forEach(p => { aMap[p.user_id] = p.avatar_url; });
      setAvatarMap(aMap);

      const now = new Date();
      const actMap: Record<string, { active: boolean; lastActive: string }> = {};
      userIds.forEach(uid => {
        const userBookings = (bookingsRes.data || []).filter(b => b.user_id === uid);
        if (userBookings.length > 0) {
          const lastDate = new Date(userBookings[0].created_at);
          const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          actMap[uid] = {
            active: diffDays <= 7,
            lastActive: diffDays <= 7 ? "Active this week" : diffDays <= 14 ? "Last active 2 weeks ago" : `Last active ${Math.floor(diffDays / 7)} weeks ago`,
          };
        } else {
          actMap[uid] = { active: false, lastActive: "New player" };
        }
      });
      setActivityMap(actMap);
    }

    setLoading(false);
  };

  const isAlreadyNudged = (userId: string, sportId: string) => {
    return sentNudges.some(n => n.receiver_id === userId && n.sport_id === sportId);
  };

  const handleSendNudge = async () => {
    if (!nudgeDialog) return;
    setSending(true);
    const success = await sendNudge(nudgeDialog.match.user_id, nudgeDialog.sport.sport_id);
    setSending(false);
    if (success) {
      toast.success(`Nudge sent to ${nudgeDialog.match.display_name}!`);
      setNudgeDialog(null);
    } else {
      toast.error("Failed to send nudge. You may have already nudged this person for this sport.");
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(260 30% 10%) 0%, hsl(240 20% 5%) 50%, hsl(240 25% 3%) 100%)' }}>
      <Navbar />
      <div className="page-offset-top pb-16 container mx-auto px-4 sm:px-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-bold text-foreground mb-4 -tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-8">
            {pageSubtitle}
          </p>
          {criteria.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full pb-2"
            >
              <div className="mx-auto flex flex-wrap justify-center gap-2 sm:gap-3 px-1">
                {criteria.map((c, i) => {
                  const goldHue = 43;
                  const hues = [160, 200, 280, 40, 340];
                  const hue = c.use_gold ? goldHue : hues[i % hues.length];

                  const iconMap: Record<string, LucideIcon> = {
                    skill: Gauge, level: Gauge,
                    playstyle: Swords, style: Swords,
                    availability: CalendarClock, schedule: CalendarClock, time: CalendarClock,
                    goal: Target, goals: Target,
                    location: MapPin, locations: MapPin, preferred: MapPin,
                  };
                  const key = c.label.toLowerCase().split(" ").find((w: string) => iconMap[w]) || "";
                  const Icon = iconMap[key] || Sparkles;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 200 }}
                      whileHover={{ scale: 1.04, y: -2 }}
                      className="group relative flex flex-col lg:flex-row items-center gap-1 lg:gap-2.5 rounded-xl lg:rounded-2xl px-2 py-1.5 lg:px-5 lg:py-3 text-foreground cursor-default overflow-hidden min-w-[60px] lg:min-w-0"
                      style={{
                        background: `linear-gradient(135deg, hsl(${hue} 50% 15% / 0.6), hsl(${hue} 40% 20% / 0.3))`,
                        border: `1px solid hsl(${hue} 50% 40% / 0.35)`,
                        boxShadow: `0 0 12px hsl(${hue} 60% 50% / 0.25), 0 0 30px hsl(${hue} 60% 50% / 0.12), inset 0 1px 0 hsl(${hue} 50% 80% / 0.1)`,
                      }}
                    >
                      <span
                        className="flex items-center justify-center h-4 w-4 lg:h-6 lg:w-6 rounded-full"
                        style={{
                          background: `hsl(${hue} 60% 50% / 0.2)`,
                          color: `hsl(${hue} 70% 65%)`,
                          border: `1px solid hsl(${hue} 60% 50% / 0.3)`,
                        }}
                      >
                        <Icon className="h-2.5 w-2.5 lg:h-3.5 lg:w-3.5" />
                      </span>
                      <span className="whitespace-nowrap text-[9px] lg:text-sm font-semibold leading-tight text-center">{c.label}</span>
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at 30% 50%, hsl(${hue} 60% 50% / 0.1), transparent 70%)`,
                        }}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}


          {user && (
            <Link to="/profile?tab=myplayer" className="inline-block mt-6">
              <Button
                variant="outline"
                className="h-10 px-6 text-[10px] uppercase tracking-[0.2em] font-medium border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-500"
              >
                View My Player
                <ChevronRight className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          )}
        </motion.div>

        {!user ? (
          <>
            <div className="w-full max-w-md mx-auto h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent mb-8" />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center pb-12"
            >
              <MatchmakerIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <h2 className="font-heading text-xl font-bold text-foreground mb-2">Sign in to find matches</h2>
              <p className="text-muted-foreground text-sm mb-5">Create an account and set up your MyPlayer profile to get started.</p>
              <Button onClick={() => navigate("/auth")} className="glow px-8 h-11 font-semibold">
                Login / Sign Up
              </Button>
            </motion.div>
          </>
        ) : hasProfile === false ? (
          <>
            <div className="w-full max-w-md mx-auto h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent mb-8" />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center pb-12"
            >
              <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <h2 className="font-heading text-xl font-bold text-foreground mb-2">Set up your MyPlayer profile first</h2>
              <p className="text-muted-foreground text-sm mb-5">We need to know your sports and levels to find the best matches for you.</p>
              <Button onClick={() => navigate("/profile?tab=myplayer")} className="glow px-8 h-11 font-semibold gap-2">
                Go to Profile <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </>
        ) : (
          <>
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap items-center gap-3 mb-8"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                Filter:
              </div>

              <select
                value={sportFilter}
                onChange={(e) => { setSportFilter(e.target.value); setLocationFilter(""); }}
                className="rounded-full px-4 py-2 text-sm font-medium border border-border bg-background text-foreground appearance-none cursor-pointer hover:border-primary/50 transition-all focus:outline-none focus:border-primary pr-8"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                }}
              >
                <option value="">All Sports</option>
                {offerings.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>

              {locations.length > 0 && (
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="rounded-full px-4 py-2 text-sm font-medium border border-border bg-background text-foreground appearance-none cursor-pointer hover:border-primary/50 transition-all focus:outline-none focus:border-primary pr-8"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                  }}
                >
                  <option value="">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              )}
            </motion.div>

            {/* Results */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-xl bg-black/40 backdrop-blur-xl border-0 border-t-[0.5px] border-l-[0.5px] border-white/[0.12] p-6 space-y-4 animate-pulse h-52">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-muted" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-3 w-16 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-muted rounded" />
                      <div className="h-3 w-3/4 bg-muted rounded" />
                    </div>
                    <div className="h-8 w-20 bg-muted rounded-full" />
                  </div>
                ))}
              </div>
            ) : matches.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <MatchmakerIcon className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <h2 className="font-heading text-xl font-bold text-foreground mb-2">No matches found yet</h2>
                <p className="text-muted-foreground">Try removing filters, or check back later as more players join.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {matches.map((match, idx) => {
                    const badge = MATCH_BADGE[match.best_match];
                    const BadgeIcon = badge.icon;
                    const primarySport = match.sports[0];
                    const primaryColor = primarySport?.brand_color;

                    const cardGlow = primaryColor
                      ? `0 0 20px hsl(${primaryColor} / 0.15), inset 0 0 40px hsl(${primaryColor} / 0.03)`
                      : undefined;

                    return (
                      <motion.div
                        key={match.user_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        className="relative rounded-xl bg-black/40 backdrop-blur-xl border-0 border-t-[0.5px] border-l-[0.5px] border-white/[0.12] p-5 transition-all duration-500 ease-out group overflow-hidden hover:scale-[1.02]"
                        style={{
                          boxShadow: primaryColor
                            ? `0 0 24px hsl(${primaryColor} / 0.12), 0 8px 32px -8px hsl(0 0% 0% / 0.5)`
                            : `0 8px 32px -8px hsl(0 0% 0% / 0.5)`,
                        }}
                      >
                        {/* Animated mesh gradient background */}
                        <div
                          className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none rounded-xl"
                          style={{
                            background: primaryColor
                              ? `radial-gradient(ellipse at 20% 50%, hsl(${primaryColor} / 0.4), transparent 60%), radial-gradient(ellipse at 80% 20%, hsl(var(--primary) / 0.3), transparent 50%)`
                              : `radial-gradient(ellipse at 20% 50%, hsl(240 60% 40% / 0.4), transparent 60%), radial-gradient(ellipse at 80% 20%, hsl(var(--primary) / 0.3), transparent 50%)`,
                          }}
                        />
                        {/* Header — name + avatar only, no contact info */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {avatarMap[match.user_id] ? (
                              <img
                                src={avatarMap[match.user_id]!}
                                alt={match.display_name}
                                className="h-11 w-11 rounded-full object-cover border-2 shrink-0"
                                style={{ borderColor: primaryColor ? `hsl(${primaryColor} / 0.4)` : 'hsl(var(--border))', boxShadow: primaryColor ? `0 0 12px hsl(${primaryColor} / 0.25)` : undefined }}
                              />
                            ) : (
                              <div className="relative h-11 w-11 rounded-full bg-muted/40 flex flex-col items-center justify-center shrink-0 border border-border">
                                <svg className="h-5 w-5 text-muted-foreground/50" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                <Camera className="h-2.5 w-2.5 text-muted-foreground/40 absolute bottom-0.5 right-0.5" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-heading font-semibold text-foreground">{match.display_name}</p>
                                {activityMap[match.user_id]?.active && (
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                  </span>
                                )}
                              </div>
                              {!avatarMap[match.user_id] && (
                                <p className="text-[9px] text-primary/70 font-medium">Add photo</p>
                              )}
                              <p className="text-[10px]" style={{ color: activityMap[match.user_id]?.active ? "hsl(142 60% 50%)" : "hsl(var(--muted-foreground))" }}>
                                {activityMap[match.user_id]?.lastActive || `${match.sports.length} sport${match.sports.length > 1 ? "s" : ""}`}
                              </p>
                              {!avatarMap[match.user_id] && (
                                <p className="text-[9px] text-primary/50 italic">Players with photos get 3x more matches.</p>
                              )}
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor: `hsl(${badge.bg} / 0.15)`,
                              color: `hsl(${badge.color})`,
                            }}
                          >
                            <BadgeIcon className="h-3 w-3" />
                            {badge.label}
                          </div>
                        </div>

                        {/* Sports — with nudge button per sport */}
                        <div className="space-y-2">
                          {match.sports.map((sport) => {
                            const alreadySent = isAlreadyNudged(match.user_id, sport.sport_id);
                            return (
                              <div
                                key={sport.sport_id}
                                className="rounded-lg p-2.5 transition-all"
                                style={{
                                  backgroundColor: sport.brand_color
                                    ? `hsl(${sport.brand_color} / 0.08)`
                                    : "hsl(var(--secondary))",
                                  borderLeft: sport.brand_color
                                    ? `3px solid hsl(${sport.brand_color})`
                                    : "3px solid hsl(var(--border))",
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p
                                      className="text-sm font-medium"
                                      style={{
                                        color: sport.brand_color
                                          ? `hsl(${sport.brand_color})`
                                          : "hsl(var(--foreground))",
                                      }}
                                    >
                                      {sport.sport_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {sport.level_label}
                                      {sport.playstyle && ` · ${sport.playstyle.replace("_", " ")}`}
                                    </p>
                                    {sport.match_details && sport.match_details.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {sport.match_details.map((d) => (
                                          <span
                                            key={d}
                                            className="text-[10px] rounded-full px-1.5 py-0.5 font-medium"
                                            style={{
                                              backgroundColor: sport.brand_color
                                                ? `hsl(${sport.brand_color} / 0.15)`
                                                : "hsl(var(--accent))",
                                              color: sport.brand_color
                                                ? `hsl(${sport.brand_color})`
                                                : "hsl(var(--accent-foreground))",
                                            }}
                                          >
                                            ✓ {d}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={alreadySent ? "secondary" : "default"}
                                    disabled={alreadySent}
                                    onClick={() => setNudgeDialog({ match, sport })}
                                    className="gap-1.5 shrink-0 ml-2"
                                  >
                                    <Send className="h-3 w-3" />
                                    {alreadySent ? "Nudged" : "Nudge"}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {/* Nudge confirmation dialog */}
        <Dialog open={!!nudgeDialog} onOpenChange={(o) => !o && setNudgeDialog(null)}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" /> Send a Nudge
              </DialogTitle>
            </DialogHeader>
            {nudgeDialog && (
              <div className="space-y-4 pt-2">
                <p className="text-muted-foreground">
                  Send a nudge to <span className="font-semibold text-foreground">{nudgeDialog.match.display_name}</span> for{" "}
                  <span className="font-semibold" style={{ color: nudgeDialog.sport.brand_color ? `hsl(${nudgeDialog.sport.brand_color})` : "hsl(var(--primary))" }}>
                    {nudgeDialog.sport.sport_name}
                  </span>?
                </p>
                <p className="text-sm text-muted-foreground">
                  They'll receive an email and a notification. If they accept, you'll become workout buddies and can see each other's contact info.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setNudgeDialog(null)} className="flex-1">Cancel</Button>
                  <Button onClick={handleSendNudge} disabled={sending} className="flex-1 glow gap-2">
                    <Send className="h-4 w-4" />
                    {sending ? "Sending..." : "Send Nudge"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MatchmakerPage;
