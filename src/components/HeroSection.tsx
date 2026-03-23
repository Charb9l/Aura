import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CalendarDays, GraduationCap, Users, Star, Handshake, Activity, Trophy, LayoutGrid, Heart, Dumbbell } from "lucide-react";
import FeaturedClubsStrip from "@/components/FeaturedClubsStrip";
import { supabase } from "@/integrations/supabase/client";

interface HeroButton { to: string; label: string; glow?: boolean; }

interface HeroContent {
  hero_subtitle: string;
  hero_buttons: HeroButton[];
  show_scroll_indicator?: boolean;
  landing_image_1?: string;
  landing_image_2?: string;
}

const HeroSection = () => {
  const [content, setContent] = useState<HeroContent | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("page_content").select("*").eq("page_slug", "home").single();
      if (data) setContent(data.content as unknown as HeroContent);
    };
    fetch();
  }, []);

  const subtitle = content?.hero_subtitle || "Movement & Mindfulness";
  const actions = content?.hero_buttons?.map((b, i) => ({ ...b, delay: 0.3 + i * 0.1 })) || [];
  const showScrollIndicator = content?.show_scroll_indicator ?? false;
  const image1 = content?.landing_image_1;
  const image2 = content?.landing_image_2;

  const routeIconMap: Record<string, React.ReactNode> = {
    "/book": <CalendarDays className="h-6 w-6" />,
    "/academy": <GraduationCap className="h-6 w-6" />,
    "/clubs": <Users className="h-6 w-6" />,
    "/loyalty": <Star className="h-6 w-6" />,
    "/matchmaker": <Handshake className="h-6 w-6" />,
    "/habits": <Activity className="h-6 w-6" />,
    "/community": <LayoutGrid className="h-6 w-6" />,
    "/profile": <Heart className="h-6 w-6" />,
  };

  const getFallbackIcon = (label: string): React.ReactNode => {
    const l = label.toLowerCase();
    if (l.includes("match")) return <Handshake className="h-6 w-6" />;
    if (l.includes("habit") || l.includes("track")) return <Activity className="h-6 w-6" />;
    if (l.includes("loyal") || l.includes("reward")) return <Star className="h-6 w-6" />;
    if (l.includes("book") || l.includes("calendar")) return <CalendarDays className="h-6 w-6" />;
    if (l.includes("academ") || l.includes("train")) return <GraduationCap className="h-6 w-6" />;
    if (l.includes("club") || l.includes("partner")) return <Users className="h-6 w-6" />;
    if (l.includes("communit")) return <LayoutGrid className="h-6 w-6" />;
    if (l.includes("fitness") || l.includes("workout")) return <Dumbbell className="h-6 w-6" />;
    return <Trophy className="h-6 w-6" />;
  };

  return (
    <section className="relative flex flex-col items-center pt-28 pb-6 md:pt-32 md:pb-8 overflow-hidden">
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 flex flex-col items-center text-center gap-6 md:gap-8">
        {/* Subtitle only */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-xs uppercase tracking-[0.3em] text-primary font-semibold"
        >
          {subtitle}
        </motion.p>

        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 w-full max-w-sm lg:max-w-lg mx-auto">
            {actions.map((action) => {
              const icon = routeIconMap[action.to] || getFallbackIcon(action.label);
              return (
                <motion.div
                  key={action.to}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: action.delay }}
                  className="flex flex-col items-center gap-2"
                >
                  <Link
                    to={action.to}
                    className="group relative flex items-center justify-center rounded-2xl w-16 h-16 lg:w-20 lg:h-20 transition-all duration-300 bg-card border border-border shadow-sm hover:shadow-lg hover:border-primary/40 hover:-translate-y-1"
                  >
                    <span className="text-primary group-hover:scale-110 transition-transform">{icon}</span>
                  </Link>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-foreground/60 leading-tight text-center max-w-[72px]">{action.label}</span>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Two Rectangle Image Bubbles */}
        {(image1 || image2) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-2 gap-3 w-full max-w-lg lg:max-w-4xl"
          >
            {image1 && (
              <div className="rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-[16/7] border border-border shadow-sm">
                <img src={image1} alt="Featured" className="w-full h-full object-cover" />
              </div>
            )}
            {image2 && (
              <div className="rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-[16/7] border border-border shadow-sm">
                <img src={image2} alt="Featured" className="w-full h-full object-cover" />
              </div>
            )}
          </motion.div>
        )}

        {/* Featured Partners Strip */}
        <FeaturedClubsStrip variant="hero" />
      </div>

      {/* Scroll indicator */}
      {showScrollIndicator && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
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
