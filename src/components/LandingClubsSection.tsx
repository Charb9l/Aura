import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPinned, ArrowRight, Handshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const LandingClubsSection = () => {
  const [club, setClub] = useState<Club | null>(null);
  const [pictures, setPictures] = useState<ClubPicture[]>([]);
  const [pageTitle, setPageTitle] = useState("Our Clubs & Partners");
  const [pageSubtitle, setPageSubtitle] = useState("Meet the clubs and studios that power our platform.");
  const [showPartnerForm, setShowPartnerForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Get featured club ID from home page content
      const { data: homeContent } = await supabase
        .from("page_content").select("content").eq("page_slug", "home").single();
      const featuredClubId = (homeContent?.content as any)?.featured_club_id;

      // Get clubs page content for title/subtitle
      const { data: clubsContent } = await supabase
        .from("page_content").select("content").eq("page_slug", "clubs").single();
      if (clubsContent?.content) {
        const c = clubsContent.content as any;
        if (c.title) setPageTitle(c.title);
        if (c.subtitle) setPageSubtitle(c.subtitle);
      }

      // Get the featured club
      let clubData: Club | null = null;
      if (featuredClubId) {
        const { data } = await supabase.from("clubs").select("id, name, description, logo_url, offerings").eq("id", featuredClubId).eq("published", true).single();
        clubData = data as unknown as Club;
      }
      if (!clubData) {
        // Fallback: first published club
        const { data } = await supabase.from("clubs").select("id, name, description, logo_url, offerings").eq("published", true).order("name").limit(1);
        if (data && data.length > 0) clubData = data[0] as unknown as Club;
      }
      if (clubData) {
        setClub(clubData);
        const { data: pics } = await supabase
          .from("club_pictures").select("*").eq("club_id", clubData.id).order("display_order").limit(1);
        if (pics) setPictures(pics as unknown as ClubPicture[]);
      }
    };
    fetchData();
  }, []);

  if (!club) return null;

  const coverImage = pictures[0]?.image_url || (club.logo_url?.startsWith("http") ? club.logo_url : null);

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
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <MapPinned className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">{pageTitle}</h2>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto mb-4">{pageSubtitle}</p>
          <Button
            onClick={() => setShowPartnerForm(true)}
            variant="outline"
            size="sm"
            className="text-xs uppercase tracking-[0.12em] font-medium border-primary/40 text-primary hover:bg-primary/10 transition-all gap-2 rounded-full"
          >
            <Handshake className="h-3.5 w-3.5" /> Become a Partner
          </Button>
        </div>

        {/* Featured Club Bubble */}
        <div className="flex items-center gap-4">
          <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            {coverImage && (
              <div className="h-40 sm:h-52 w-full overflow-hidden">
                <img src={coverImage} alt={club.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-2">
                {club.logo_url?.startsWith("http") && (
                  <div className="h-10 w-10 rounded-xl overflow-hidden bg-secondary flex items-center justify-center shrink-0">
                    <img src={club.logo_url} alt={club.name} className="h-full w-full object-contain" />
                  </div>
                )}
                <h3 className="font-heading text-base sm:text-lg font-bold text-foreground">{club.name}</h3>
              </div>
              {club.description && (
                <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 mb-3">{club.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {club.offerings.slice(0, 4).map((offering) => (
                  <Badge key={offering} variant="secondary" className="text-[10px] sm:text-xs">{offering}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* View All Arrow */}
          <Link
            to="/clubs"
            className="flex flex-col items-center gap-2 text-primary hover:text-primary/80 transition-colors shrink-0"
          >
            <ArrowRight className="h-8 w-8" />
            <span className="text-xs font-semibold uppercase tracking-wider">View All</span>
          </Link>
        </div>
      </motion.section>

      <PartnerRequestForm open={showPartnerForm} onOpenChange={setShowPartnerForm} />
    </>
  );
};

export default LandingClubsSection;
