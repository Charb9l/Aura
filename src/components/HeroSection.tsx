import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import FeaturedClubsStrip from "@/components/FeaturedClubsStrip";
import HeroProgressCard from "@/components/HeroProgressCard";
import LiveFeatureIcons from "@/components/LiveFeatureIcons";
import LiveActivityStrip from "@/components/LiveActivityStrip";
import MatchmakingSocialCard from "@/components/MatchmakingSocialCard";
import NextBadgeCard from "@/components/NextBadgeCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface HeroContent {
  hero_subtitle: string;
  show_scroll_indicator?: boolean;
  landing_image_1?: string;
  landing_image_2?: string;
}

const HeroSection = () => {
  const { user } = useAuth();
  const [content, setContent] = useState<HeroContent | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("page_content").select("*").eq("page_slug", "home").single();
      if (data) setContent(data.content as unknown as HeroContent);
    };
    fetch();
  }, []);

  const subtitle = content?.hero_subtitle || "Movement & Mindfulness";
  
  const showScrollIndicator = content?.show_scroll_indicator ?? false;
  const image1 = content?.landing_image_1;
  const image2 = content?.landing_image_2;


  return (
    <section className="relative flex flex-col items-center page-offset-top pb-6 md:pb-8 overflow-hidden">
      {/* Subtle mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient-purple opacity-40 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 flex flex-col items-center text-center gap-6 md:gap-8">
        {user ? (
          <HeroProgressCard />
        ) : (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-label text-xs uppercase tracking-[0.3em] text-primary font-semibold"
          >
            {subtitle}
          </motion.p>
        )}

        {user && <LiveFeatureIcons />}


        {user && <NextBadgeCard />}
        {user && <MatchmakingSocialCard />}
        {user && <LiveActivityStrip />}

        {(image1 || image2) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 gap-3 w-full max-w-lg lg:max-w-4xl"
          >
            {image1 && (
              <div className="rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-[16/7] shadow-lg">
                <img src={image1} alt="Featured" className="w-full h-full object-cover" />
              </div>
            )}
            {image2 && (
              <div className="rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-[16/7] shadow-lg">
                <img src={image2} alt="Featured" className="w-full h-full object-cover" />
              </div>
            )}
          </motion.div>
        )}

        <FeaturedClubsStrip variant="hero" />
      </div>

      {showScrollIndicator && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-6"
        >
          <motion.svg
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary/60"
          >
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
          </motion.svg>
        </motion.div>
      )}
    </section>
  );
};

export default HeroSection;
