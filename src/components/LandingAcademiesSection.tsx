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
      // Get featured academy ID from home page content
      const { data: homeContent } = await supabase
        .from("page_content").select("content").eq("page_slug", "home").single();
      const featuredAcademyId = (homeContent?.content as any)?.featured_academy_id;

      // Get academy page content for title/subtitle
      const { data: academyContent } = await supabase
        .from("page_content").select("content").eq("page_slug", "academy").single();
      if (academyContent?.content) {
        const c = academyContent.content as any;
        if (c.title) setPageTitle(c.title);
        if (c.subtitle) setPageSubtitle(c.subtitle);
      }

      // Get the featured academy club
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

  return (
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
          <Award className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">{pageTitle}</h2>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">{pageSubtitle}</p>
      </div>

      {/* Featured Academy Bubble */}
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
              <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">{club.description}</p>
            )}
          </div>
        </div>

        {/* View All Arrow */}
        <Link
          to="/academy"
          className="flex flex-col items-center gap-2 text-primary hover:text-primary/80 transition-colors shrink-0"
        >
          <ArrowRight className="h-8 w-8" />
          <span className="text-xs font-semibold uppercase tracking-wider">View All</span>
        </Link>
      </div>
    </motion.section>
  );
};

export default LandingAcademiesSection;
