import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Users, Sparkles, MapPin, Trophy, Filter, Zap, Star, ArrowRight, Gauge, Swords, CalendarClock, Target, Send, ChevronRight, type LucideIcon } from "lucide-react";
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
  perfect: { label: "Perfect Match", icon: Zap, color: "48 90% 50%", bg: "48 90% 50%" },
  good: { label: "Great Match", icon: Star, color: "142 60% 45%", bg: "142 60% 45%" },
  "sport-only": { label: "Same Sport", icon: Users, color: "212 70% 55%", bg: "212 70% 55%" },
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
    setMatches(result.matches || []);
    if (result.offerings) setOfferings(result.offerings);
    if (result.locations) setLocations(result.locations);
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-16 container mx-auto px-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-bold text-foreground mb-4">
            {pageTitle}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            {pageSubtitle}
          </p>
          {criteria.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full overflow-x-auto pb-2 scrollbar-hide"
            >
              <div className="mx-auto flex w-max min-w-full md:min-w-0 md:w-auto md:justify-center gap-2 sm:gap-3 px-1 snap-x snap-mandatory">
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
                    whileHover={{ scale: 1.08, y: -2 }}
                    className="group relative flex flex-col sm:flex-row items-center gap-1 sm:gap-2.5 rounded-xl sm:rounded-2xl px-2.5 py-2 sm:px-5 sm:py-3 text-foreground cursor-default overflow-hidden shrink-0"
                    style={{
                      background: `linear-gradient(135deg, hsl(${hue} 50% 15% / 0.6), hsl(${hue} 40% 20% / 0.3))`,
                      border: `1px solid hsl(${hue} 50% 40% / 0.35)`,
                      boxShadow: `0 0 12px hsl(${hue} 60% 50% / 0.25), 0 0 30px hsl(${hue} 60% 50% / 0.12), inset 0 1px 0 hsl(${hue} 50% 80% / 0.1)`,
                    }}
                  >
                    <span
                      className="flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full"
                      style={{
                        background: `hsl(${hue} 60% 50% / 0.2)`,
                        color: `hsl(${hue} 70% 65%)`,
                        border: `1px solid hsl(${hue} 60% 50% / 0.3)`,
                      }}
                    >
                      <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </span>
                    <span className="whitespace-nowrap text-[10px] sm:text-sm font-semibold leading-tight text-center">{c.label}</span>
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 30% 50%, hsl(${hue} 60% 50% / 0.1), transparent 70%)`,
                      }}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          )}


          {user && (
            <Link to="/profile" className="inline-block mt-6">
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
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
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
              <Button onClick={() => navigate("/profile")} className="glow px-8 h-11 font-semibold gap-2">
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
                  <div key={i} className="rounded-xl border border-border bg-card p-6 animate-pulse h-52" />
                ))}
              </div>
            ) : matches.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
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
                        className="rounded-xl border border-border bg-card p-5 hover:border-muted-foreground/30 transition-all group"
                        style={{
                          boxShadow: cardGlow,
                          borderColor: primaryColor ? `hsl(${primaryColor} / 0.2)` : undefined,
                        }}
                      >
                        {/* Header — name + avatar only, no contact info */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                              style={{
                                backgroundColor: primaryColor
                                  ? `hsl(${primaryColor})`
                                  : "hsl(var(--primary))",
                              }}
                            >
                              {match.display_name[0]}
                            </div>
                            <div>
                              <p className="font-heading font-semibold text-foreground">{match.display_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {match.sports.length} sport{match.sports.length > 1 ? "s" : ""}
                              </p>
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
