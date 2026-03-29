import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CalendarDays, GraduationCap, LayoutGrid, Heart, Dumbbell, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import FeaturedClubsStrip from "@/components/FeaturedClubsStrip";
import HeroProgressCard from "@/components/HeroProgressCard";
import LiveFeatureIcons from "@/components/LiveFeatureIcons";
import LiveActivityStrip from "@/components/LiveActivityStrip";
import useEmblaCarousel from "embla-carousel-react";

import NextBadgeCard from "@/components/NextBadgeCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ClubsIcon, AcademiesIcon, MatchmakerIcon, HabitTrackerIcon, LoyaltyIcon } from "@/components/icons/BrandIcons";

interface HeroButton { to: string; label: string; glow?: boolean; }

interface HeroContent {
  hero_subtitle: string;
  hero_buttons: HeroButton[];
  show_scroll_indicator?: boolean;
  landing_image_1?: string;
  landing_image_2?: string;
  landing_images?: string[];
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
  const actions = content?.hero_buttons?.map((b, i) => ({ ...b, delay: 0.15 + i * 0.05 })) || [];
  const showScrollIndicator = content?.show_scroll_indicator ?? false;

  // Build carousel images: prefer new array, fallback to legacy fields
  const carouselImages: string[] = content?.landing_images?.length
    ? content.landing_images
    : [content?.landing_image_1, content?.landing_image_2].filter(Boolean) as string[];

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", slidesToScroll: 2 });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => { emblaApi.off("select", onSelect); emblaApi.off("reInit", onSelect); };
  }, [emblaApi, onSelect]);

  const liveRoutes = new Set(["/loyalty", "/matchmaker", "/habits"]);
  const filteredActions = user ? actions.filter(a => !liveRoutes.has(a.to)) : actions;

  const routeIconMap: Record<string, React.ReactNode> = {
    "/book": <CalendarDays className="h-6 w-6" />,
    "/academy": <AcademiesIcon className="h-6 w-6" />,
    "/clubs": <ClubsIcon className="h-6 w-6" />,
    "/loyalty": <LoyaltyIcon className="h-6 w-6" />,
    "/matchmaker": <MatchmakerIcon className="h-6 w-6" />,
    "/habits": <HabitTrackerIcon className="h-6 w-6" />,
    "/community": <LayoutGrid className="h-6 w-6" />,
    "/profile": <Heart className="h-6 w-6" />,
  };

  const getFallbackIcon = (label: string): React.ReactNode => {
    const l = label.toLowerCase();
    if (l.includes("match")) return <MatchmakerIcon className="h-6 w-6" />;
    if (l.includes("habit") || l.includes("track")) return <HabitTrackerIcon className="h-6 w-6" />;
    if (l.includes("loyal") || l.includes("reward")) return <LoyaltyIcon className="h-6 w-6" />;
    if (l.includes("book") || l.includes("calendar")) return <CalendarDays className="h-6 w-6" />;
    if (l.includes("academ") || l.includes("train")) return <AcademiesIcon className="h-6 w-6" />;
    if (l.includes("club") || l.includes("partner")) return <ClubsIcon className="h-6 w-6" />;
    if (l.includes("communit")) return <LayoutGrid className="h-6 w-6" />;
    if (l.includes("fitness") || l.includes("workout")) return <Dumbbell className="h-6 w-6" />;
    return <Trophy className="h-6 w-6" />;
  };

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

        {filteredActions.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 w-full max-w-sm lg:max-w-lg mx-auto">
            {filteredActions.map((action) => {
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
                    className="group relative flex items-center justify-center rounded-2xl w-16 h-16 lg:w-20 lg:h-20 transition-all duration-500 bg-white/[0.04] backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[0_0_24px_rgba(124,58,237,0.2)] hover:bg-white/[0.07] hover:scale-105 hover:-translate-y-1"
                  >
                    <span className="text-primary group-hover:scale-110 transition-transform duration-500">{icon}</span>
                  </Link>
                  <span className="font-label text-[9px] font-semibold uppercase tracking-[0.15em] text-foreground/40 leading-tight text-center max-w-[72px]">{action.label}</span>
                </motion.div>
              );
            })}
          </div>
        )}

        {user && <NextBadgeCard />}
        {user && <LiveActivityStrip />}

        {carouselImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative w-full max-w-lg lg:max-w-4xl"
          >
            <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
              <div className="flex gap-3">
                {carouselImages.map((url, i) => (
                  <div key={i} className="flex-[0_0_calc(50%-6px)] min-w-0">
                    <div className="rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-[16/7] shadow-lg">
                      <img src={url} alt={`Featured ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {carouselImages.length > 2 && (
              <div className="flex justify-center gap-2 mt-3">
                <button
                  onClick={() => emblaApi?.scrollPrev()}
                  disabled={!canScrollPrev}
                  className="rounded-full bg-white/[0.06] backdrop-blur-xl p-2 text-foreground/60 hover:text-foreground hover:bg-white/[0.1] transition-all disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => emblaApi?.scrollNext()}
                  disabled={!canScrollNext}
                  className="rounded-full bg-white/[0.06] backdrop-blur-xl p-2 text-foreground/60 hover:text-foreground hover:bg-white/[0.1] transition-all disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
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
