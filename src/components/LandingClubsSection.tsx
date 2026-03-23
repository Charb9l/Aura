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
      const { data: homeContent } = await supabase
        .from("page_content").select("content").eq("page_slug", "home").single();
      const featuredClubId = (homeContent?.content as any)?.featured_club_id;

      const { data: clubsContent } = await supabase
        .from("page_content").select("content").eq("page_slug", "clubs").single();
      if (clubsContent?.content) {
        const c = clubsContent.content as any;
        if (c.title) setPageTitle(c.title);
        if (c.subtitle) setPageSubtitle(c.subtitle);
      }

      let clubData: Club | null = null;
      if (featuredClubId) {
        const { data } = await supabase.from("clubs").select("id, name, description, logo_url, offerings").eq("id", featuredClubId).eq("published", true).single();
        clubData = data as unknown as Club;
      }
      if (!clubData) {
        const { data } = await supabase.from("clubs").select("id, name, description, logo_url, offerings").eq("published", true).order("name").limit(1);
        if (data && data.length > 0) clubData = data[0] as unknown as Club;
      }
      if (clubData) {
        setClub(clubData);
        const { data: pics } = await supabase
          .from("club_pictures").select("*").eq("club_id", clubData.id).order("display_order").limit(3);
        if (pics) setPictures(pics as unknown as ClubPicture[]);
      }
    };
    fetchData();
  }, []);

  if (!club) return null;

  const coverImage = pictures[0]?.image_url || (club.logo_url?.startsWith("http") ? club.logo_url : null);
  const logoSrc = club.logo_url?.startsWith("http") ? club.logo_url : null;

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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 mb-4">
            <MapPinned className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">{pageTitle}</span>
          </div>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">{pageSubtitle}</p>
        </div>

        {/* Featured Club Card */}
        <Link to="/clubs" className="block rounded-3xl overflow-hidden bg-card border border-border shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all">
          {/* Cover Image */}
          {coverImage && (
            <div className="relative h-48 sm:h-56 w-full overflow-hidden">
              <img src={coverImage} alt={club.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
              {/* Club identity overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
                {logoSrc && (
                  <div className="h-14 w-14 rounded-2xl overflow-hidden bg-card/90 backdrop-blur-sm border-2 border-card shadow-lg flex items-center justify-center shrink-0">
                    <img src={logoSrc} alt={club.name} className="h-full w-full object-contain" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-lg sm:text-xl font-bold text-card leading-tight drop-shadow-md truncate">
                    {club.name}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Card Body */}
          <div className="p-5 space-y-4">
            {!coverImage && (
              <div className="flex items-center gap-3 mb-1">
                {logoSrc && (
                  <div className="h-12 w-12 rounded-2xl overflow-hidden bg-secondary flex items-center justify-center shrink-0">
                    <img src={logoSrc} alt={club.name} className="h-full w-full object-contain" />
                  </div>
                )}
                <h3 className="font-heading text-lg font-bold text-foreground">{club.name}</h3>
              </div>
            )}

            {club.description && (
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{club.description}</p>
            )}

            {/* Offerings */}
            <div className="flex flex-wrap gap-2">
              {club.offerings.slice(0, 4).map((offering) => (
                <span
                  key={offering}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-medium"
                >
                  {offering}
                </span>
              ))}
            </div>

          </div>
        </Link>

        {/* Actions Row — outside the card */}
        <div className="flex items-center gap-3 mt-4">
          <Link
            to="/clubs"
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            View All Clubs
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Button
            onClick={() => setShowPartnerForm(true)}
            variant="outline"
            size="sm"
            className="h-11 px-4 rounded-2xl text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5 gap-1.5"
          >
            <Handshake className="h-3.5 w-3.5" />
            Partner
          </Button>
        </div>
      </motion.section>

      <PartnerRequestForm open={showPartnerForm} onOpenChange={setShowPartnerForm} />
    </>
  );
};

export default LandingClubsSection;
