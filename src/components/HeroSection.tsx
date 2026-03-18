import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { CalendarDays, GraduationCap, Users, Star, Handshake, Activity, Trophy, LayoutGrid, Heart, Dumbbell } from "lucide-react";
import FeaturedClubsStrip from "@/components/FeaturedClubsStrip";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

import basketballImg from "@/assets/basketball-court.png";
import tennisImg from "@/assets/tennis-court.png";
import yogaImg from "@/assets/aerial-yoga-studio.png";
import pilatesImg from "@/assets/pilates-studio.png";

const fallbackPanels = [
  { image: basketballImg, alt: "Basketball court" },
  { image: tennisImg, alt: "Tennis court" },
  { image: yogaImg, alt: "Aerial yoga studio" },
  { image: pilatesImg, alt: "Pilates studio" },
];

const defaultActions = [
  { to: "/book", label: "Book", icon: "calendar", delay: 0.4 },
  { to: "/academy", label: "Academies", icon: "graduation", delay: 0.5 },
  { to: "/clubs", label: "Clubs", icon: "users", delay: 0.6 },
  { to: "/loyalty", label: "Loyalty", icon: "star", delay: 0.7 },
];

interface HeroContent {
  hero_subtitle: string;
  hero_title_line1: string;
  hero_title_line2: string;
  hero_buttons: { to: string; label: string; glow?: boolean }[];
  show_scroll_indicator?: boolean;
}

const CYCLE_INTERVAL = 4000;

const getGridLayout = (count: number) => {
  if (count === 1) return { cols: "grid-cols-1", rows: "" };
  if (count === 2) return { cols: "grid-cols-2", rows: "" };
  if (count === 3) return { cols: "grid-cols-3", rows: "" };
  if (count === 4) return { cols: "grid-cols-2 md:grid-cols-4", rows: "" };
  if (count <= 6) return { cols: "grid-cols-3", rows: "grid-rows-2" };
  if (count <= 9) return { cols: "grid-cols-3", rows: "grid-rows-3" };
  return { cols: "grid-cols-3 md:grid-cols-6", rows: "", windowed: true, windowSize: 6 };
};

const HeroSection = () => {
  const [allPictures, setAllPictures] = useState<{ image: string; alt: string }[]>([]);
  const [content, setContent] = useState<HeroContent | null>(null);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [picRes, contentRes] = await Promise.all([
        supabase.from("hero_pictures").select("*").eq("page_slug", "home").order("display_order", { ascending: true }),
        supabase.from("page_content").select("*").eq("page_slug", "home").single(),
      ]);
      if (picRes.data && picRes.data.length > 0) {
        setAllPictures(picRes.data.map((p: any) => ({ image: p.image_url, alt: "Hero image" })));
      }
      if (contentRes.data) {
        setContent(contentRes.data.content as unknown as HeroContent);
      }
      setLoaded(true);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (allPictures.length <= 9) return;
    const timer = setInterval(() => {
      setCycleIndex(prev => (prev + 1) % allPictures.length);
    }, CYCLE_INTERVAL);
    return () => clearInterval(timer);
  }, [allPictures.length]);

  const pictures = useMemo(() => {
    const pics = allPictures.length > 0 ? allPictures : (loaded ? [] : fallbackPanels);
    if (pics.length === 0) return [];
    if (pics.length <= 9) return pics;
    const windowSize = 6;
    return Array.from({ length: windowSize }, (_, i) => {
      const idx = (cycleIndex + i) % pics.length;
      return pics[idx];
    });
  }, [allPictures, cycleIndex, loaded]);

  const subtitle = content?.hero_subtitle || "Movement & Mindfulness";
  const titleLine1 = content?.hero_title_line1 || "Your Journey.";
  const titleLine2 = content?.hero_title_line2 || "Your Space.";
  const actions = content?.hero_buttons?.map((b, i) => ({ ...b, delay: 0.4 + i * 0.1 })) || defaultActions;
  const showScrollIndicator = content?.show_scroll_indicator ?? false;

  const layout = getGridLayout(pictures.length);

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
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background: dynamic photo grid */}
      {pictures.length > 0 && (
        <div className={cn("absolute inset-0 grid pointer-events-none", layout.cols, layout.rows)}>
          <AnimatePresence mode="popLayout">
            {pictures.map((panel, i) => (
              <motion.div
                key={`${panel.image}-${i}-${cycleIndex}`}
                className="relative overflow-hidden"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 1.2, delay: i * 0.08 }}
              >
                <img
                  src={panel.image}
                  alt={panel.alt}
                  className={cn(
                    "h-full w-full object-cover brightness-105 saturate-[1.1]",
                    pictures.length === 1 && "saturate-100"
                  )}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Overlay — bright gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 flex flex-col items-center text-center gap-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-6 font-semibold">
            {subtitle}
          </p>
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground leading-[1.05]">
            {titleLine1}
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{titleLine2}</span>
          </h1>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3 w-full max-w-sm lg:max-w-lg mx-auto">
          {actions.map((action) => {
            const icon = routeIconMap[action.to] || getFallbackIcon(action.label);
            return (
              <motion.div
                key={action.to}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: action.delay }}
                className="flex flex-col items-center gap-1.5"
              >
                <Link
                  to={action.to}
                  className={cn(
                    "group relative flex items-center justify-center rounded-2xl w-16 h-16 lg:w-20 lg:h-20 transition-all duration-300",
                    "bg-card border border-border shadow-sm hover:shadow-lg hover:border-primary/40 hover:-translate-y-1"
                  )}
                >
                  <span className="text-primary group-hover:scale-110 transition-transform">{icon}</span>
                </Link>
                <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-foreground/60 leading-tight text-center max-w-[72px]">{action.label}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Featured Partners Strip */}
        <FeaturedClubsStrip variant="hero" />
      </div>

      {/* Scroll indicator */}
      {showScrollIndicator && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute bottom-24 md:bottom-20 lg:bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-8 h-8 rounded-full border-2 border-primary/30 flex items-center justify-center"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </motion.div>
        </motion.div>
      )}
    </section>
  );
};

export default HeroSection;
