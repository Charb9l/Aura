import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ArrowRight, Handshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const clubActivityMap: Record<string, string> = {
  "Beirut Basketball Club": "basketball",
  "Hardcourt Dbayeh Tennis Academy": "tennis",
  "En Forme": "pilates",
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

  // Hero grid pictures
  const [heroPictures, setHeroPictures] = useState<{ image: string; alt: string }[]>([]);
  const [heroCycleIndex, setHeroCycleIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const [clubsRes, contentRes, heroRes] = await Promise.all([
        supabase.from("clubs").select("*").order("name"),
        supabase.from("page_content").select("content").eq("page_slug", "clubs").single(),
        supabase.from("hero_pictures").select("id, image_url, display_order").eq("page_slug", "clubs").order("display_order"),
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
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        {visibleHeroPics.length > 0 && (
          <div className={cn("absolute inset-0 grid", getGridLayout(visibleHeroPics.length))}>
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
        <div className="absolute inset-0 bg-background/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 py-32 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
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

        {loading ? (
          <p className="text-muted-foreground text-center py-20">Loading...</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club, i) => (
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
                    const activity = clubActivityMap[selectedClub.name];
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
