import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, CheckCircle2, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

interface AcademyPicture {
  id: string;
  club_id: string;
  image_url: string;
  picture_type: string;
  display_order: number;
}

interface ClubLocation {
  id: string;
  club_id: string;
  name: string;
  location: string;
}

interface FormField {
  key: string;
  label: string;
  type: string;
  required: boolean;
}

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

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const [clubs, setClubs] = useState<AcademyClub[]>([]);
  const [offerings, setOfferings] = useState<OfferingData[]>([]);
  const [pictures, setPictures] = useState<AcademyPicture[]>([]);
  const [allLocations, setAllLocations] = useState<ClubLocation[]>([]);
  const [filterSlugs, setFilterSlugs] = useState<string[]>([]);
  const [filterLocation, setFilterLocation] = useState("");
  const [pageTitle, setPageTitle] = useState("Join Our Academy");
  const [pageSubtitle, setPageSubtitle] = useState("Train with the best. Elevate your game.");
  const [personalFields, setPersonalFields] = useState<FormField[]>([
    { key: "name", label: "Full Name", type: "text", required: true },
    { key: "email", label: "Email", type: "email", required: true },
    { key: "phone", label: "Phone Number", type: "phone", required: true },
    { key: "age", label: "Age", type: "number", required: true },
  ]);

  // Dialog state
  const [selectedClub, setSelectedClub] = useState<AcademyClub | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedLocationId, setSelectedLocationId] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [experience, setExperience] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [clubsRes, offRes, picsRes, locsRes, contentRes] = await Promise.all([
        supabase.from("clubs").select("*").order("name"),
        supabase.from("offerings").select("*").order("name"),
        supabase.from("academy_pictures").select("*").order("display_order"),
        supabase.from("club_locations").select("*").order("name"),
        supabase.from("page_content").select("content").eq("page_slug", "academy").single(),
      ]);
      if (clubsRes.data) setClubs(clubsRes.data as unknown as AcademyClub[]);
      if (offRes.data) setOfferings(offRes.data as unknown as OfferingData[]);
      if (picsRes.data) setPictures(picsRes.data as unknown as AcademyPicture[]);
      if (locsRes.data) setAllLocations(locsRes.data as unknown as ClubLocation[]);
      if (contentRes.data) {
        const c = contentRes.data.content as any;
        if (c?.title) setPageTitle(c.title);
        if (c?.subtitle) setPageSubtitle(c.subtitle);
        if (c?.fields) setPersonalFields(c.fields);
      }
    };
    fetchData();
  }, []);

  // Build academy clubs
  const academyClubs = useMemo(() => {
    return clubs
      .filter(c => c.offerings.some(o => o.toLowerCase().includes("academy")))
      .map(club => {
        let matchedSlug = "";
        for (const [slug, keywords] of Object.entries(activityKeywords)) {
          if (club.offerings.some(o => o.toLowerCase().includes("academy") && keywords.some(k => o.toLowerCase().includes(k)))) {
            matchedSlug = slug;
            break;
          }
        }
        if (!matchedSlug) {
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
          ...club,
          slug: matchedSlug,
          brand: brandForSlug(matchedSlug),
          offeringImageUrl: offering?.logo_url || null,
        };
      })
      .filter(Boolean) as (AcademyClub & { slug: string; brand: "tennis" | "basketball" | "wellness"; offeringImageUrl: string | null })[];
  }, [clubs, offerings]);

  // Derive offerings that have academies for the sport filter
  const academyOfferings = useMemo(() => {
    const slugs = new Set(academyClubs.map(s => s.slug));
    return offerings.filter(o => slugs.has(o.slug));
  }, [academyClubs, offerings]);

  // Filter by sport first
  const sportFilteredClubs = useMemo(() => {
    if (filterSlugs.length === 0) return academyClubs;
    return academyClubs.filter(s => filterSlugs.includes(s.slug));
  }, [academyClubs, filterSlugs]);

  // Available locations for the currently sport-filtered clubs
  const availableLocations = useMemo(() => {
    const clubIds = new Set(sportFilteredClubs.map(c => c.id));
    const locs = allLocations.filter(l => clubIds.has(l.club_id));
    // Deduplicate by location name
    const uniqueMap = new Map<string, ClubLocation>();
    locs.forEach(l => {
      if (!uniqueMap.has(l.location)) uniqueMap.set(l.location, l);
    });
    return Array.from(uniqueMap.values());
  }, [sportFilteredClubs, allLocations]);

  // Filter by location second
  const filteredClubs = useMemo(() => {
    if (!filterLocation) return sportFilteredClubs;
    const clubIdsWithLocation = new Set(
      allLocations.filter(l => l.location === filterLocation).map(l => l.club_id)
    );
    return sportFilteredClubs.filter(c => clubIdsWithLocation.has(c.id));
  }, [sportFilteredClubs, filterLocation, allLocations]);

  // Get pictures for selected club
  const selectedBubblePic = (clubId: string) => pictures.find(p => p.club_id === clubId && p.picture_type === "bubble");
  const selectedCarouselPics = useMemo(() => {
    if (!selectedClub) return [];
    return pictures.filter(p => p.club_id === selectedClub.id && p.picture_type === "carousel");
  }, [selectedClub, pictures]);

  // Locations for selected club (for registration)
  const selectedClubLocations = useMemo(() => {
    if (!selectedClub) return [];
    return allLocations.filter(l => l.club_id === selectedClub.id);
  }, [selectedClub, allLocations]);

  const openClubDialog = (club: AcademyClub & { slug: string; brand: string }) => {
    setSelectedClub(club);
    setCarouselIndex(0);
    setShowRegister(false);
    setSubmitted(false);
    setSelectedLocationId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const selectedClubData = selectedClub ? academyClubs.find(c => c.id === selectedClub.id) : null;
  const selectedBrand = selectedClubData?.brand;

  // Auto-select location if only 1
  useEffect(() => {
    if (showRegister && selectedClubLocations.length === 1) {
      setSelectedLocationId(selectedClubLocations[0].id);
    }
  }, [showRegister, selectedClubLocations]);

  const needsLocation = selectedClubLocations.length > 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground">{pageTitle}</h1>
              </div>
              <p className="text-muted-foreground text-lg">{pageSubtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              {academyOfferings.length > 0 && (
                <ActivityFilter offerings={academyOfferings} selected={filterSlugs} onChange={(s) => { setFilterSlugs(s); setFilterLocation(""); }} />
              )}
              {availableLocations.length > 1 && (
                <Select value={filterLocation || "all"} onValueChange={(v) => setFilterLocation(v === "all" ? "" : v)}>
                  <SelectTrigger className="h-10 w-44 bg-secondary border-border">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue placeholder="All Locations" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border z-50">
                    <SelectItem value="all">All Locations</SelectItem>
                    {availableLocations.map(l => (
                      <SelectItem key={l.id} value={l.location}>{l.location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </motion.div>

        {/* Academy Club Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club, i) => {
            return (
              <motion.button
                key={club.id}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => openClubDialog(club)}
                className="rounded-2xl border border-border bg-card p-6 hover:shadow-xl hover:shadow-primary/5 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-4">
                  {club.logo_url && (
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-secondary flex items-center justify-center shrink-0">
                      <img src={club.logo_url} alt={club.name} className="h-full w-full object-contain" />
                    </div>
                  )}
                  <h3 className="font-heading text-xl font-bold text-foreground">{club.name}</h3>
                </div>
                {club.description && (
                  <p className="text-muted-foreground text-sm line-clamp-2">{club.description}</p>
                )}
              </motion.button>
            );
          })}
        </div>

        {filteredClubs.length === 0 && (
          <div className="text-center py-20">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No academies available yet.</p>
          </div>
        )}
      </div>

      {/* Club Detail Dialog */}
      <Dialog open={!!selectedClub} onOpenChange={(o) => { if (!o) { setSelectedClub(null); setShowRegister(false); setSubmitted(false); } }}>
        <DialogContent className="bg-card border-border max-w-3xl w-[66vw] max-h-[85vh] overflow-y-auto p-0">
          {selectedClub && !submitted && !showRegister && (
            <div>
              {/* Carousel */}
              {selectedCarouselPics.length > 0 ? (
                <div className="relative aspect-video bg-secondary overflow-hidden rounded-t-lg">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={carouselIndex}
                      src={selectedCarouselPics[carouselIndex]?.image_url}
                      alt="Academy gallery"
                      className="w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </AnimatePresence>
                  {selectedCarouselPics.length > 1 && (
                    <>
                      <button
                        onClick={() => setCarouselIndex(prev => prev === 0 ? selectedCarouselPics.length - 1 : prev - 1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 hover:bg-background transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setCarouselIndex(prev => prev === selectedCarouselPics.length - 1 ? 0 : prev + 1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 hover:bg-background transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {selectedCarouselPics.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCarouselIndex(i)}
                            className={cn("h-2 w-2 rounded-full transition-all", i === carouselIndex ? "bg-primary w-6" : "bg-foreground/30")}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-secondary rounded-t-lg flex items-center justify-center">
                  <GraduationCap className="h-16 w-16 text-muted-foreground" />
                </div>
              )}

              {/* Club info */}
              <div className="p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {selectedClub.logo_url && (
                      <img src={selectedClub.logo_url} alt={selectedClub.name} className="h-10 w-10 rounded-full object-cover" />
                    )}
                    <h2 className="font-heading text-2xl font-bold text-foreground">{selectedClub.name}</h2>
                  </div>
                  <Button onClick={() => setShowRegister(true)} className="h-11 px-6 font-semibold glow">
                    Register Now
                  </Button>
                </div>
                {selectedClub.description && (
                  <p className="text-muted-foreground leading-relaxed">{selectedClub.description}</p>
                )}
              </div>
            </div>
          )}

          {/* Registration Form */}
          {selectedClub && showRegister && !submitted && (
            <div className="p-6">
              <button onClick={() => setShowRegister(false)} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Register for {selectedClub.name}</h2>
              <p className="text-muted-foreground text-sm mb-6">Fill in your details to apply.</p>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Location selector */}
                {needsLocation && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">Choose Location</Label>
                    {selectedClubLocations.length === 1 ? (
                      <div className={cn("w-full h-12 flex items-center px-4 rounded-md border bg-secondary", selectedBrand && brandInputClass[selectedBrand])}>
                        <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-foreground">{selectedClubLocations[0].name} — {selectedClubLocations[0].location}</span>
                      </div>
                    ) : (
                      <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                        <SelectTrigger className={cn("w-full h-12", selectedLocationId && selectedBrand && brandInputClass[selectedBrand])}>
                          <SelectValue placeholder="Select a location..." />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border z-50">
                          {selectedClubLocations.map(loc => (
                            <SelectItem key={loc.id} value={loc.id}>{loc.name} — {loc.location}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {personalFields.map((field) => {
                    if (field.type === "phone") {
                      return <PhoneInput key={field.key} value={phone} onChange={setPhone} required={field.required} />;
                    }
                    const val = field.key === "name" ? name : field.key === "email" ? email : field.key === "age" ? age : "";
                    const setter = field.key === "name" ? setName : field.key === "email" ? setEmail : field.key === "age" ? setAge : undefined;
                    return (
                      <Input
                        key={field.key}
                        type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
                        placeholder={field.label}
                        value={val}
                        onChange={setter ? (e) => setter(e.target.value) : undefined}
                        required={field.required}
                        className={cn("h-12 bg-secondary border-border", selectedBrand && brandInputClass[selectedBrand])}
                      />
                    );
                  })}
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Experience Level</Label>
                  <Textarea
                    placeholder="Tell us about your experience level, goals, and any previous training..."
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    required
                    className={cn("min-h-[120px] bg-secondary border-border", selectedBrand && brandInputClass[selectedBrand])}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!name || !email || !isValidEmail(email) || !phone || !age || !experience || (needsLocation && !selectedLocationId)}
                  className="h-12 px-8 text-base font-bold rounded-xl glow w-full"
                >
                  Submit Application
                </Button>
              </form>
            </div>
          )}

          {/* Submitted */}
          {selectedClub && submitted && (
            <div className="p-6 text-center py-16">
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Application Submitted!</h2>
              <p className="text-muted-foreground">
                We've received your {selectedClub.name} application. Our team will reach out to {email} shortly.
              </p>
              <Button variant="outline" className="mt-6" onClick={() => { setSelectedClub(null); setShowRegister(false); setSubmitted(false); setName(""); setEmail(""); setPhone(""); setAge(""); setExperience(""); setSelectedLocationId(""); }}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AcademyPage;
