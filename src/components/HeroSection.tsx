import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
  { to: "/book", label: "Book a Session", delay: 0.4 },
  { to: "/academy", label: "Join Our Academies", delay: 0.5 },
  { to: "/clubs", label: "Clubs & Partners", delay: 0.6 },
  { to: "/loyalty", label: "Loyalty Program", delay: 0.7 },
];

interface HeroContent {
  hero_subtitle: string;
  hero_title_line1: string;
  hero_title_line2: string;
  hero_buttons: { to: string; label: string; glow?: boolean }[];
  show_scroll_indicator?: boolean;
}

const CYCLE_INTERVAL = 4000;

/** Returns a grid layout config based on picture count */
const getGridLayout = (count: number) => {
  if (count === 1) return { cols: "grid-cols-1", rows: "" };
  if (count === 2) return { cols: "grid-cols-2", rows: "" };
  if (count === 3) return { cols: "grid-cols-3", rows: "" };
  if (count === 4) return { cols: "grid-cols-2 md:grid-cols-4", rows: "" };
  if (count <= 6) return { cols: "grid-cols-3", rows: "grid-rows-2" };
  if (count <= 9) return { cols: "grid-cols-3", rows: "grid-rows-3" };
  // For large counts, show a rotating window of 6
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

  // Cycle for large collections (>9 pictures)
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
    // Windowed: show 6 at a time cycling through
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

  const totalCount = allPictures.length > 0 ? allPictures.length : (loaded ? 0 : fallbackPanels.length);
  const layout = getGridLayout(pictures.length);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background: dynamic photo grid */}
      {pictures.length > 0 && (
        <div className={cn("absolute inset-0 grid", layout.cols, layout.rows)}>
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
                    "h-full w-full object-cover saturate-[0.3] contrast-[1.1]",
                    pictures.length === 1 && "saturate-[0.4]"
                  )}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Overlay — deep obsidian fade */}
      <div className="absolute inset-0 bg-background/80" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 flex flex-col items-center text-center gap-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl"
        >
          <p className="text-xs uppercase tracking-[0.4em] text-primary mb-8 font-medium">
            {subtitle}
          </p>
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-light tracking-tight text-foreground leading-[1.05]">
            {titleLine1}
            <br />
            <span className="italic text-primary">{titleLine2}</span>
          </h1>
        </motion.div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-4 w-full max-w-4xl">
          {actions.map((action) => {
            const hasGlow = (action as any).glow;
            return (
              <motion.div
                key={action.to}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: action.delay }}
                className="w-full sm:w-[calc(50%-0.5rem)]"
              >
                <Link
                  to={action.to}
                  className={cn(
                    "group flex items-center justify-between glass-card rounded-sm px-8 py-6 text-xs font-medium uppercase tracking-[0.15em] transition-all duration-300",
                    hasGlow
                      ? "border-primary/30 text-primary hover:bg-primary/5"
                      : "text-foreground/80 hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <span>{action.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-30 group-hover:opacity-80 group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Scroll indicator */}
      {showScrollIndicator && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <div className="h-16 w-[1px] bg-gradient-to-b from-transparent via-primary/40 to-transparent relative">
            <motion.div
              animate={{ y: [0, 40, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 left-1/2 -translate-x-1/2 h-2 w-[1px] bg-primary"
            />
          </div>
        </motion.div>
      )}
    </section>
  );
};

export default HeroSection;
