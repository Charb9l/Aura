import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AcademyClub {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  offerings: string[];
}

interface AcademyPicture {
  id: string;
  club_id: string;
  image_url: string;
  display_order: number;
}

const LandingAcademiesSection = () => {
  const [club, setClub] = useState<AcademyClub | null>(null);
  const [pictures, setPictures] = useState<AcademyPicture[]>([]);
  const [pageTitle, setPageTitle] = useState("Join Our Academy");
  const [pageSubtitle, setPageSubtitle] = useState("Train with the best. Elevate your game.");

  useEffect(() => {
    const fetchData = async () => {
      const { data: homeContent } = await supabase
        .from("page_content").select("content").eq("page_slug", "home").single();
      const featuredAcademyId = (homeContent?.content as any)?.featured_academy_id;

      const { data: academyContent } = await supabase
        .from("page_content").select("content").eq("page_slug", "academy").single();
      if (academyContent?.content) {
        const c = academyContent.content as any;
        if (c.title) setPageTitle(c.title);
        if (c.subtitle) setPageSubtitle(c.subtitle);
      }

      let clubData: AcademyClub | null = null;
      if (featuredAcademyId) {
        const { data } = await supabase.from("clubs").select("id, name, description, logo_url, offerings").eq("id", featuredAcademyId).eq("published", true).eq("has_academy", true).single();
        clubData = data as unknown as AcademyClub;
      }
      if (!clubData) {
        const { data } = await supabase.from("clubs").select("id, name, description, logo_url, offerings").eq("published", true).eq("has_academy", true).order("name").limit(1);
        if (data && data.length > 0) clubData = data[0] as unknown as AcademyClub;
      }
      if (clubData) {
        setClub(clubData);
        const { data: pics } = await supabase
          .from("academy_pictures").select("*").eq("club_id", clubData.id).order("display_order").limit(1);
        if (pics) setPictures(pics as unknown as AcademyPicture[]);
      }
    };
    fetchData();
  }, []);

  if (!club) return null;

  const coverImage = pictures[0]?.image_url || (club.logo_url?.startsWith("http") ? club.logo_url : null);
  const logoSrc = club.logo_url?.startsWith("http") ? club.logo_url : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 mb-4">
          <Award className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">{pageTitle}</span>
        </div>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">{pageSubtitle}</p>
      </div>

      {/* Featured Academy Card */}
      <Link to="/academy" className="block rounded-3xl overflow-hidden bg-card border border-border shadow-lg shadow-accent/5 hover:shadow-xl hover:shadow-accent/10 transition-all">
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

          </div>
        </div>

        {/* Action — outside the card */}
        <Link
          to="/academy"
          className="flex items-center justify-center gap-2 h-11 mt-4 rounded-2xl bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition-all shadow-md shadow-accent/20"
        >
          View All Academies
          <ArrowRight className="h-4 w-4" />
        </Link>
    </motion.section>
  );
};

export default LandingAcademiesSection;
