import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { GraduationCap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import PhoneInput from "@/components/PhoneInput";
import ActivityFilter from "@/components/ActivityFilter";

interface AcademyClub {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  offerings: string[];
  has_academy: boolean;
}

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

const brandBorder = {
  tennis: "border-brand-tennis shadow-[0_0_20px_hsl(212_70%_55%/0.3)]",
  basketball: "border-brand-basketball shadow-[0_0_20px_hsl(25_90%_55%/0.3)]",
  wellness: "border-brand-wellness shadow-[0_0_20px_hsl(100_22%_60%/0.3)]",
};

const brandInputClass = {
  tennis: "border-brand-tennis/50 focus:border-brand-tennis shadow-[0_0_12px_hsl(212_70%_55%/0.15)]",
  basketball: "border-brand-basketball/50 focus:border-brand-basketball shadow-[0_0_12px_hsl(25_90%_55%/0.15)]",
  wellness: "border-brand-wellness/50 focus:border-brand-wellness shadow-[0_0_12px_hsl(100_22%_60%/0.15)]",
};

const brandForSlug = (slug: string): "tennis" | "basketball" | "wellness" => {
  if (slug === "tennis") return "tennis";
  if (slug === "basketball") return "basketball";
  return "wellness";
};

const activityKeywords: Record<string, string[]> = {
  basketball: ["basketball"],
  tennis: ["tennis"],
  pilates: ["pilates"],
  "aerial-yoga": ["yoga", "aerial"],
};

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const AcademyPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("sport") || "";

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const [clubs, setClubs] = useState<AcademyClub[]>([]);
  const [offerings, setOfferings] = useState<OfferingData[]>([]);
  const [clubLocations, setClubLocations] = useState<ClubLocation[]>([]);
  const [selectedSport, setSelectedSport] = useState(preselected);
  const [selectedLocation, setSelectedLocation] = useState("");
  const selectedBrand = selectedSport ? brandForSlug(selectedSport) : undefined;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [experience, setExperience] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [filterSlugs, setFilterSlugs] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [clubsRes, offRes, locRes] = await Promise.all([
        supabase.from("clubs").select("*").order("name"),
        supabase.from("offerings").select("*").order("name"),
        supabase.from("club_locations").select("*").order("name"),
      ]);
      if (clubsRes.data) setClubs(clubsRes.data as unknown as AcademyClub[]);
      if (offRes.data) setOfferings(offRes.data as unknown as OfferingData[]);
      if (locRes.data) setClubLocations(locRes.data as unknown as ClubLocation[]);
    };
    fetchData();
  }, []);

  // Build academy sports from clubs that have academy offerings
  const sports = useMemo(() => {
    return clubs
      .filter(c => c.offerings.some(o => o.toLowerCase().includes("academy")))
      .map((club) => {
        // Find what activity slug this club maps to via academy offering
        let matchedSlug = "";
        for (const [slug, keywords] of Object.entries(activityKeywords)) {
          if (club.offerings.some(o => o.toLowerCase().includes("academy") && keywords.some(k => o.toLowerCase().includes(k)))) {
            matchedSlug = slug;
            break;
          }
        }
        if (!matchedSlug) {
          // Fallback: check general offerings
          for (const [slug, keywords] of Object.entries(activityKeywords)) {
            if (club.offerings.some(o => keywords.some(k => o.toLowerCase().includes(k)))) {
              matchedSlug = slug;
              break;
            }
          }
        }
        if (!matchedSlug) return null;
        const offering = offerings.find(o => o.slug === matchedSlug);
        return {
          slug: matchedSlug,
          clubId: club.id,
          name: club.name,
          clubLogoUrl: club.logo_url?.startsWith("http") ? club.logo_url : null,
          offeringImageUrl: offering?.logo_url || null,
          brand: brandForSlug(matchedSlug),
          description: club.description || "",
        };
      })
      .filter(Boolean) as { slug: string; clubId: string; name: string; clubLogoUrl: string | null; offeringImageUrl: string | null; brand: "tennis" | "basketball" | "wellness"; description: string }[];
  }, [clubs, offerings]);

  // Derive offerings that have academies for the filter
  const academyOfferings = useMemo(() => {
    const slugs = new Set(sports.map(s => s.slug));
    return offerings.filter(o => slugs.has(o.slug));
  }, [sports, offerings]);

  const filteredSports = useMemo(() => {
    if (filterSlugs.length === 0) return sports;
    return sports.filter(s => filterSlugs.includes(s.slug));
  }, [sports, filterSlugs]);

  // Get locations for the selected sport's club
  const selectedSportData = sports.find(s => s.slug === selectedSport);
  const locationsForSelected = useMemo(() => {
    if (!selectedSportData) return [];
    return clubLocations.filter(l => l.club_id === selectedSportData.clubId);
  }, [selectedSportData, clubLocations]);

  // Auto-select if only one location
  useEffect(() => {
    if (locationsForSelected.length === 1) {
      setSelectedLocation(locationsForSelected[0].id);
    }
  }, [locationsForSelected]);

  const needsLocation = locationsForSelected.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-6 pt-20">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <CheckCircle2 className="h-20 w-20 text-primary mx-auto mb-6" />
            <h1 className="font-heading text-4xl font-bold text-foreground mb-3">Application Submitted!</h1>
            <p className="text-muted-foreground text-lg">
              We've received your {sports.find(s => s.slug === selectedSport)?.name} application.
            </p>
            <p className="text-muted-foreground">Our team will reach out to {email} shortly.</p>
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
          <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground">Join Our Academy</h1>
              </div>
              <p className="text-muted-foreground text-lg">Train with the best. Elevate your game.</p>
            </div>
            {academyOfferings.length > 0 && (
              <ActivityFilter offerings={academyOfferings} selected={filterSlugs} onChange={setFilterSlugs} />
            )}
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className={cn("max-w-3xl space-y-10 rounded-2xl transition-all", selectedBrand === "tennis" && "shadow-[0_0_30px_hsl(212_70%_55%/0.15)] border border-brand-tennis/20 p-6", selectedBrand === "basketball" && "shadow-[0_0_30px_hsl(25_90%_55%/0.15)] border border-brand-basketball/20 p-6", selectedBrand === "wellness" && "shadow-[0_0_30px_hsl(100_22%_60%/0.15)] border border-brand-wellness/20 p-6", !selectedBrand && "p-0 border-0 shadow-none")}>
          {/* Sport selection */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Label className="text-sm font-medium text-muted-foreground mb-4 block">Choose Your Academy</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSports.map((s) => (
                <button
                  type="button"
                  key={s.slug}
                  onClick={() => { setSelectedSport(s.slug); setSelectedLocation(""); }}
                  className={cn(
                    "relative overflow-hidden rounded-xl border-2 transition-all text-left",
                    selectedSport === s.slug
                      ? brandBorder[s.brand]
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <div className="aspect-video overflow-hidden bg-secondary">
                    {s.offeringImageUrl && <img src={s.offeringImageUrl} alt={s.name} className="h-full w-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                  </div>
                  {s.clubLogoUrl && (
                    <div className="absolute top-3 right-3">
                      <img src={s.clubLogoUrl} alt={s.name} className="h-10 w-10 rounded-full object-cover shadow-lg" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="font-heading text-xl font-bold text-foreground mb-1">{s.name}</h3>
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Location selector - only if multiple locations */}
          {selectedSport && needsLocation && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Label className="text-sm font-medium text-muted-foreground mb-4 block">Choose Location</Label>
              {locationsForSelected.length === 1 ? (
                <div className={cn("w-full max-w-sm h-12 flex items-center px-4 rounded-md border bg-secondary", selectedBrand && brandInputClass[selectedBrand])}>
                  <span className="text-foreground">{locationsForSelected[0].name} — {locationsForSelected[0].location}</span>
                </div>
              ) : (
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className={cn("w-full max-w-sm h-12", selectedLocation && selectedBrand && brandInputClass[selectedBrand])}>
                    <SelectValue placeholder="Select a location..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border z-50">
                    {locationsForSelected.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name} — {loc.location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </motion.div>
          )}

          {/* Personal info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
            <Label className="text-sm font-medium text-muted-foreground mb-4 block">Personal Information</Label>
            <div className="grid md:grid-cols-2 gap-4">
              <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required className={cn("h-12 bg-secondary border-border", selectedBrand && brandInputClass[selectedBrand])} />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={cn("h-12 bg-secondary border-border", selectedBrand && brandInputClass[selectedBrand])} />
              <PhoneInput value={phone} onChange={setPhone} required />
              <Input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} required className={cn("h-12 bg-secondary border-border", selectedBrand && brandInputClass[selectedBrand])} />
            </div>
          </motion.div>

          {/* Experience */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Label className="text-sm font-medium text-muted-foreground mb-4 block">Experience Level</Label>
            <Textarea
              placeholder="Tell us about your experience level, goals, and any previous training..."
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              required
              className={cn("min-h-[120px] bg-secondary border-border", selectedBrand && brandInputClass[selectedBrand])}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Button
              type="submit"
              disabled={!selectedSport || !name || !email || !isValidEmail(email) || !phone || !age || !experience || (needsLocation && !selectedLocation)}
              className="h-14 px-10 text-lg font-bold rounded-xl glow"
            >
              Submit Application
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default AcademyPage;
