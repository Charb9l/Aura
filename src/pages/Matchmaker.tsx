import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Users, Sparkles, MapPin, Trophy, Filter, Zap, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const [criteria, setCriteria] = useState<{ emoji: string; label: string }[]>([]);

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-16 container mx-auto px-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 mb-5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered</span>
          </div>
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-foreground mb-4">
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
              className="flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto"
            >
              {criteria.map((c, i) => {
                const hues = [160, 200, 280, 40, 340];
                const hue = hues[i % hues.length];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 200 }}
                    whileHover={{ scale: 1.08, y: -2 }}
                    className="group relative inline-flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-semibold text-foreground cursor-default overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, hsl(${hue} 50% 15% / 0.6), hsl(${hue} 40% 20% / 0.3))`,
                      border: `1px solid hsl(${hue} 50% 40% / 0.35)`,
                      boxShadow: `0 0 12px hsl(${hue} 60% 50% / 0.25), 0 0 30px hsl(${hue} 60% 50% / 0.12), inset 0 1px 0 hsl(${hue} 50% 80% / 0.1)`,
                    }}
                  >
                    <span
                      className="flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold"
                      style={{
                        background: `hsl(${hue} 60% 50% / 0.2)`,
                        color: `hsl(${hue} 70% 65%)`,
                        border: `1px solid hsl(${hue} 60% 50% / 0.3)`,
                      }}
                    >
                      {c.emoji || "✓"}
                    </span>
                    <span>{c.label}</span>
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
        </motion.div>

        {!user ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Sign in to find matches</h2>
            <p className="text-muted-foreground mb-6">Create an account and set up your MyPlayer profile to get started.</p>
            <Button onClick={() => navigate("/auth")} className="glow px-8 h-12 font-semibold text-base">
              Login / Sign Up
            </Button>
          </motion.div>
        ) : hasProfile === false ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Trophy className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Set up your MyPlayer profile first</h2>
            <p className="text-muted-foreground mb-6">We need to know your sports and levels to find the best matches for you.</p>
            <Button onClick={() => navigate("/profile")} className="glow px-8 h-12 font-semibold text-base gap-2">
              Go to Profile <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
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

              {/* Sport filter chips */}
              <button
                onClick={() => setSportFilter("")}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium border transition-all",
                  !sportFilter
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground/50"
                )}
              >
                All Sports
              </button>
              {offerings.map((o) => {
                const active = sportFilter === o.id;
                const chipStyle = active && o.brand_color
                  ? {
                      borderColor: `hsl(${o.brand_color})`,
                      backgroundColor: `hsl(${o.brand_color} / 0.15)`,
                      color: `hsl(${o.brand_color})`,
                    }
                  : {};
                return (
                  <button
                    key={o.id}
                    onClick={() => setSportFilter(active ? "" : o.id)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium border transition-all",
                      !active && "border-border text-muted-foreground hover:border-muted-foreground/50"
                    )}
                    style={chipStyle}
                  >
                    {o.name}
                  </button>
                );
              })}

              {/* Location filter */}
              {locations.length > 0 && (
                <>
                  <div className="h-5 w-px bg-border mx-1" />
                  <button
                    onClick={() => setLocationFilter("")}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium border transition-all flex items-center gap-1.5",
                      !locationFilter
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground/50"
                    )}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    All Locations
                  </button>
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => setLocationFilter(locationFilter === loc.id ? "" : loc.id)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium border transition-all flex items-center gap-1.5",
                        locationFilter === loc.id
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-border text-muted-foreground hover:border-muted-foreground/50"
                      )}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {loc.name}
                    </button>
                  ))}
                </>
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
                        {/* Header */}
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

                        {/* Sports */}
                        <div className="space-y-2">
                          {match.sports.map((sport) => (
                            <div
                              key={sport.sport_id}
                              className="flex items-center justify-between rounded-lg p-2.5 transition-all"
                              style={{
                                backgroundColor: sport.brand_color
                                  ? `hsl(${sport.brand_color} / 0.08)`
                                  : "hsl(var(--secondary))",
                                borderLeft: sport.brand_color
                                  ? `3px solid hsl(${sport.brand_color})`
                                  : "3px solid hsl(var(--border))",
                              }}
                            >
                              <div>
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
                              {sport.location_name && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {sport.location_name}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MatchmakerPage;
