import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPinned, ArrowRight, Handshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import GalleryMosaic from "@/components/GalleryMosaic";
import PartnerRequestForm from "@/components/PartnerRequestForm";

interface Club {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  offerings: string[];
}

interface ClubPicture {
  id: string;
  club_id: string;
  image_url: string;
  display_order: number;
}

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

const MAX_VISIBLE = 6;

const LandingClubsSection = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [pageTitle, setPageTitle] = useState("Our Clubs & Partners");
  const [pageSubtitle, setPageSubtitle] = useState("Meet the clubs and studios that power our platform.");
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubPictures, setClubPictures] = useState<ClubPicture[]>([]);
  const [picturesLoading, setPicturesLoading] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const [clubsRes, contentRes] = await Promise.all([
        supabase.from("clubs").select("id, name, description, logo_url, offerings").eq("published", true).order("name"),
        supabase.from("page_content").select("content").eq("page_slug", "clubs").single(),
      ]);
      if (clubsRes.data) setClubs(clubsRes.data as unknown as Club[]);
      if (contentRes.data) {
        const c = contentRes.data.content as any;
        if (c?.title) setPageTitle(c.title);
        if (c?.subtitle) setPageSubtitle(c.subtitle);
      }
    };
    fetchData();
  }, []);

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

  if (clubs.length === 0) return null;

  const displayed = clubs.slice(0, MAX_VISIBLE);
  const hasMore = clubs.length > MAX_VISIBLE;

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <MapPinned className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">{pageTitle}</h2>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto mb-5">{pageSubtitle}</p>
          <Button
            onClick={() => setShowPartnerForm(true)}
            variant="outline"
            size="sm"
            className="text-xs uppercase tracking-[0.12em] font-medium border-primary/40 text-primary hover:bg-primary/10 transition-all gap-2 rounded-full"
          >
            <Handshake className="h-3.5 w-3.5" /> Become a Partner
          </Button>
        </div>

        {/* Club Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {displayed.map((club, i) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              onClick={() => openClub(club)}
              className="rounded-2xl border border-border bg-card p-4 sm:p-5 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                {(() => {
                  const logoSrc = club.logo_url?.startsWith("http") ? club.logo_url : null;
                  return logoSrc ? (
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl overflow-hidden bg-secondary flex items-center justify-center shrink-0">
                      <img src={logoSrc} alt={club.name} className="h-full w-full object-contain" />
                    </div>
                  ) : null;
                })()}
                <h3 className="font-heading text-sm sm:text-base font-bold text-foreground leading-tight">{club.name}</h3>
              </div>
              {club.description && (
                <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 mb-3">{club.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {club.offerings.slice(0, 3).map((offering) => (
                  <Badge key={offering} variant="secondary" className="text-[10px] sm:text-xs">
                    {offering}
                  </Badge>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* See All */}
        {hasMore && (
          <div className="text-center mt-6">
            <Link
              to="/clubs"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              See all clubs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </motion.section>

      {/* Club Detail Dialog */}
      <Dialog open={!!selectedClub} onOpenChange={(o) => !o && setSelectedClub(null)}>
        <DialogContent className="bg-card border-border max-w-4xl w-[95vw] md:w-[66vw] max-h-[85vh] overflow-y-auto">
          {selectedClub && (
            <div className="p-6 space-y-5">
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
                  className="gap-2 shrink-0 self-start sm:self-auto rounded-full"
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
              {picturesLoading ? (
                <div className="h-[200px] bg-secondary rounded-2xl flex items-center justify-center">
                  <p className="text-muted-foreground">Loading pictures...</p>
                </div>
              ) : (
                <GalleryMosaic images={clubPictures} alt={selectedClub.name} fallback={null} />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PartnerRequestForm open={showPartnerForm} onOpenChange={setShowPartnerForm} />
    </>
  );
};

export default LandingClubsSection;
