import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import GalleryMosaic from "@/components/GalleryMosaic";
import PagePhotoStrip from "@/components/PagePhotoStrip";

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

const ClubsPage = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState("Our Clubs & Partners");
  const [pageSubtitle, setPageSubtitle] = useState("Meet the clubs and studios that power our platform.");
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubPictures, setClubPictures] = useState<ClubPicture[]>([]);
  const [picturesLoading, setPicturesLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const [clubsRes, contentRes] = await Promise.all([
        supabase.from("clubs").select("*").order("name"),
        supabase.from("page_content").select("content").eq("page_slug", "clubs").single(),
      ]);
      if (clubsRes.data) setClubs(clubsRes.data as unknown as Club[]);
      if (contentRes.data) {
        const c = contentRes.data.content as any;
        if (c?.title) setPageTitle(c.title);
        if (c?.subtitle) setPageSubtitle(c.subtitle);
      }
      setLoading(false);
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

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground">{pageTitle}</h1>
          </div>
          <p className="text-muted-foreground text-lg mb-6">{pageSubtitle}</p>
        </motion.div>

        <PagePhotoStrip pageSlug="clubs" className="mb-10" />


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
        <DialogContent className="bg-card border-border max-w-4xl w-[66vw] max-h-[80vh] overflow-y-auto">
          {selectedClub && (
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center gap-4">
                {(() => {
                  const logoSrc = selectedClub.logo_url?.startsWith("http") ? selectedClub.logo_url : null;
                  return logoSrc ? (
                    <div className="h-14 w-14 rounded-xl overflow-hidden bg-secondary shrink-0">
                      <img src={logoSrc} alt={selectedClub.name} className="h-full w-full object-contain" />
                    </div>
                  ) : null;
                })()}
                <h2 className="font-heading text-2xl font-bold text-foreground flex-1">{selectedClub.name}</h2>
                <Button
                  onClick={() => {
                    const activity = clubActivityMap[selectedClub.name];
                    if (activity) navigate(`/book?activity=${activity}`);
                  }}
                  className="gap-2 glow shrink-0"
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
    </div>
  );
};

export default ClubsPage;
