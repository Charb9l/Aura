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
  has_academy: boolean;
}

const MAX_VISIBLE = 6;

const LandingAcademiesSection = () => {
  const [clubs, setClubs] = useState<AcademyClub[]>([]);
  const [pageTitle, setPageTitle] = useState("Join Our Academy");
  const [pageSubtitle, setPageSubtitle] = useState("Train with the best. Elevate your game.");

  useEffect(() => {
    const fetchData = async () => {
      const [clubsRes, contentRes] = await Promise.all([
        supabase.from("clubs").select("id, name, description, logo_url, offerings, has_academy").eq("published", true).eq("has_academy", true).order("name"),
        supabase.from("page_content").select("content").eq("page_slug", "academy").single(),
      ]);
      if (clubsRes.data) setClubs(clubsRes.data as unknown as AcademyClub[]);
      if (contentRes.data) {
        const c = contentRes.data.content as any;
        if (c?.title) setPageTitle(c.title);
        if (c?.subtitle) setPageSubtitle(c.subtitle);
      }
    };
    fetchData();
  }, []);

  if (clubs.length === 0) return null;

  const displayed = clubs.slice(0, MAX_VISIBLE);
  const hasMore = clubs.length > MAX_VISIBLE;

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
        <div className="flex items-center justify-center gap-3 mb-3">
          <Award className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">{pageTitle}</h2>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">{pageSubtitle}</p>
      </div>

      {/* Academy Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {displayed.map((club, i) => (
          <motion.div
            key={club.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <Link
              to={`/academy`}
              className="block rounded-2xl border border-border bg-card p-4 sm:p-5 hover:shadow-lg hover:shadow-primary/5 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                {club.logo_url?.startsWith("http") && (
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl overflow-hidden bg-secondary flex items-center justify-center shrink-0">
                    <img src={club.logo_url} alt={club.name} className="h-full w-full object-contain" />
                  </div>
                )}
                <h3 className="font-heading text-sm sm:text-base font-bold text-foreground leading-tight">{club.name}</h3>
              </div>
              {club.description && (
                <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">{club.description}</p>
              )}
            </Link>
          </motion.div>
        ))}
      </div>

      {/* See All */}
      {hasMore && (
        <div className="text-center mt-6">
          <Link
            to="/academy"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            See all academies <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </motion.section>
  );
};

export default LandingAcademiesSection;
