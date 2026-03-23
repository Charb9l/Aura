import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Handshake, MapPin } from "lucide-react";
import { ClubsIcon } from "@/components/icons/BrandIcons";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ActivityFilter from "@/components/ActivityFilter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import GalleryMosaic from "@/components/GalleryMosaic";
import PartnerRequestForm from "@/components/PartnerRequestForm";
import MobileBackButton from "@/components/MobileBackButton";

interface Club {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  offerings: string[];
  created_at: string;
}

interface ClubPicture {
  id: string;
  club_id: string;
  image_url: string;
  display_order: number;
}

/** Derive an activity slug from a club's offerings by fuzzy-matching known slugs */
const activityKeywords: Record<string, string[]> = {
  basketball: ["basketball"],
  tennis: ["tennis"],
  pilates: ["pilates"],
  "aerial-yoga": ["yoga", "aerial"],
};

const deriveActivitySlug = (offerings: string[]): string | null => {
  for (const [slug, keywords] of Object.entries(activityKeywords)) {
    if (offerings.some(o => keywords.some(k => o.toLowerCase().includes(k)))) return slug;
  }
  return null;
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

const ClubsPage = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState("Our Clubs & Partners");
  const [pageSubtitle, setPageSubtitle] = useState("Meet the clubs and studios that power our platform.");
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubPictures, setClubPictures] = useState<ClubPicture[]>([]);
  const [picturesLoading, setPicturesLoading] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const navigate = useNavigate();

  // Filters
  const [activities, setActivities] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [clubLocations, setClubLocations] = useState<{ id: string; club_id: string; name: string; location: string }[]>([]);
  const [filterSlugs, setFilterSlugs] = useState<string[]>([]);
  const [filterLocation, setFilterLocation] = useState("");

  // Hero grid pictures
  const [heroPictures, setHeroPictures] = useState<{ image: string; alt: string }[]>([]);
  const [heroCycleIndex, setHeroCycleIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const [clubsRes, contentRes, heroRes, offeringsRes, locsRes] = await Promise.all([
        supabase.from("clubs").select("*").order("name"),
        supabase.from("page_content").select("content").eq("page_slug", "clubs").single(),
        supabase.from("hero_pictures").select("id, image_url, display_order").eq("page_slug", "clubs").order("display_order"),
        supabase.from("offerings").select("id, name, slug"),
        supabase.from("club_locations").select("id, club_id, name, location"),
      ]);
      if (clubsRes.data) setClubs((clubsRes.data as unknown as Club[]).filter(c => (c as any).published !== false));
      if (contentRes.data) {
        const c = contentRes.data.content as any;
        if (c?.title) setPageTitle(c.title);
        if (c?.subtitle) setPageSubtitle(c.subtitle);
      }
      if (heroRes.data && heroRes.data.length > 0) {
        setHeroPictures(heroRes.data.map((p: any) => ({ image: p.image_url, alt: "Clubs" })));
      }
      if (offeringsRes.data) setActivities(offeringsRes.data as any[]);
      if (locsRes.data) setClubLocations(locsRes.data as any[]);
      setLoading(false);
    };
    fetchData();
  }, []);

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

  // Unique location areas from club_locations (filtered by selected activities)
  const availableLocations = useMemo(() => {
    let relevantClubIds: Set<string>;
    if (filterSlugs.length > 0) {
      relevantClubIds = new Set(
        clubs.filter(c => filterSlugs.some(slug => c.offerings.some(o => o.toLowerCase().includes(slug.toLowerCase())))).map(c => c.id)
      );
    } else {
      relevantClubIds = new Set(clubs.map(c => c.id));
    }
    const locs = clubLocations.filter(l => relevantClubIds.has(l.club_id));
    const uniqueMap = new Map<string, typeof clubLocations[0]>();
    locs.forEach(l => { if (!uniqueMap.has(l.location)) uniqueMap.set(l.location, l); });
    return Array.from(uniqueMap.values()).sort((a, b) => a.location.localeCompare(b.location));
  }, [filterSlugs, clubs, clubLocations]);

  // Filtered clubs
  const filteredClubs = useMemo(() => {
    return clubs.filter(club => {
      // Activity filter
      if (filterSlugs.length > 0) {
        const matches = filterSlugs.some(slug => club.offerings.some(o => o.toLowerCase().includes(slug.toLowerCase())));
        if (!matches) return false;
      }
      // Location filter
      if (filterLocation) {
        const hasLocation = clubLocations.some(l => l.club_id === club.id && l.location === filterLocation);
        if (!hasLocation) return false;
      }
      return true;
    });
  }, [clubs, filterSlugs, filterLocation, clubLocations]);

  const openClub = async (club: Club) => {
    setSelectedClub(club);
    setPicturesLoading(true);
    const { data } = await supabase
      .from("club_pictures")
      .select("*")
      .eq("club_id", club.id)
      .order("display_order");
    setClubPictures((data as unknown as ClubPicture[]) || []);
    setPicturesLoading(false);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />

      {/* Hero section with dynamic grid background */}
      <section className={cn("relative flex items-center justify-center overflow-hidden", visibleHeroPics.length > 0 ? "min-h-[50vh]" : "pt-24 pb-10")}>
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

        {visibleHeroPics.length > 0 && (
          <>
            <div className="absolute inset-0 bg-background/80 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30 pointer-events-none" />
          </>
        )}

        <div className={cn("relative z-10 container mx-auto px-6 text-center", visibleHeroPics.length > 0 ? "py-32" : "")}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex items-center justify-center gap-3 mb-4">
              <MapPinned className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-light text-foreground">{pageTitle}</h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-lg mx-auto mb-6">{pageSubtitle}</p>
            <Button
              onClick={() => setShowPartnerForm(true)}
              variant="outline"
              className="h-11 px-6 text-xs uppercase tracking-[0.15em] font-medium border-primary/40 text-primary hover:bg-primary/10 transition-all gap-2"
            >
              <Handshake className="h-4 w-4" /> Become a Partner
            </Button>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-6 pb-16">
        <MobileBackButton fallbackPath="/" />

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 flex-wrap py-5">
          {activities.length > 0 && (
            <ActivityFilter activities={activities} selected={filterSlugs} onChange={(s) => { setFilterSlugs(s); setFilterLocation(""); }} />
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
          {(filterSlugs.length > 0 || filterLocation) && (
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => { setFilterSlugs([]); setFilterLocation(""); }}>
              Clear filters
            </Button>
          )}
        </motion.div>

        {loading ? (
          <p className="text-muted-foreground text-center py-20">Loading...</p>
        ) : filteredClubs.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">No clubs match the selected filters.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club, i) => (
              <motion.div
                key={club.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => openClub(club)}
                className="rounded-2xl border border-border bg-card p-6 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-4">
                  {(() => {
                    const logoSrc = club.logo_url?.startsWith("http") ? club.logo_url : null;
                    return logoSrc ? (
                      <div className="h-16 w-16 rounded-xl overflow-hidden bg-secondary flex items-center justify-center shrink-0">
                        <img src={logoSrc} alt={club.name} className="h-full w-full object-contain" />
                      </div>
                    ) : null;
                  })()}
                  <h2 className="font-heading text-xl font-bold text-foreground">{club.name}</h2>
                </div>
                {club.description && (
                  <p className="text-muted-foreground text-sm mb-4">{club.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {club.offerings.map((offering) => (
                    <Badge key={offering} variant="secondary" className="text-xs">
                      {offering}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Club Detail Dialog */}
      <Dialog open={!!selectedClub} onOpenChange={(o) => !o && setSelectedClub(null)}>
        <DialogContent className="bg-card border-border max-w-4xl w-[95vw] md:w-[66vw] max-h-[85vh] overflow-y-auto">
          {selectedClub && (
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {(() => {
                  const logoSrc = selectedClub.logo_url?.startsWith("http") ? selectedClub.logo_url : null;
                  return logoSrc ? (
                    <div className="h-14 w-14 rounded-xl overflow-hidden bg-secondary shrink-0">
                      <img src={logoSrc} alt={selectedClub.name} className="h-full w-full object-contain" />
                    </div>
                  ) : null;
                })()}
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground flex-1">{selectedClub.name}</h2>
                <Button
                  onClick={() => {
                    const activity = deriveActivitySlug(selectedClub.offerings);
                    if (activity) navigate(`/book?activity=${activity}`);
                  }}
                  className="gap-2 glow shrink-0 self-start sm:self-auto"
                >
                  Book Now <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              {selectedClub.description && (
                <p className="text-muted-foreground">{selectedClub.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {selectedClub.offerings.map((offering) => (
                  <Badge key={offering} variant="secondary">{offering}</Badge>
                ))}
              </div>

              {/* Gallery */}
              {picturesLoading ? (
                <div className="h-[200px] bg-secondary rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Loading pictures...</p>
                </div>
              ) : (
                <GalleryMosaic
                  images={clubPictures}
                  alt={selectedClub.name}
                  fallback={null}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <PartnerRequestForm open={showPartnerForm} onOpenChange={setShowPartnerForm} />
    </div>
  );
};

export default ClubsPage;
