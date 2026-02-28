import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
}

const HeroSection = () => {
  const [heroPictures, setHeroPictures] = useState<{ image: string; alt: string }[]>([]);
  const [content, setContent] = useState<HeroContent | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [picRes, contentRes] = await Promise.all([
        supabase.from("hero_pictures").select("*").eq("page_slug", "home").order("display_order", { ascending: true }),
        supabase.from("page_content").select("*").eq("page_slug", "home").single(),
      ]);
      if (picRes.data && picRes.data.length > 0) {
        setHeroPictures(picRes.data.map((p: any) => ({ image: p.image_url, alt: "Hero image" })));
      }
      if (contentRes.data) {
        setContent(contentRes.data.content as unknown as HeroContent);
      }
    };
    fetchData();
  }, []);

  const panels = heroPictures.length > 0 ? heroPictures : fallbackPanels;
  const colClass = panels.length <= 2 ? "grid-cols-1 md:grid-cols-2" : panels.length === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4";

  const subtitle = content?.hero_subtitle || "Movement & Mindfulness";
  const titleLine1 = content?.hero_title_line1 || "Your Journey.";
  const titleLine2 = content?.hero_title_line2 || "Your Space.";
  const actions = content?.hero_buttons?.map((b, i) => ({ ...b, delay: 0.4 + i * 0.1 })) || defaultActions;

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Dynamic panel background */}
      <div className={`absolute inset-0 grid ${colClass}`}>
        {panels.map((panel, i) => (
          <div key={i} className="relative overflow-hidden">
            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.4, delay: i * 0.15, ease: "easeOut" }}
              src={panel.image}
              alt={panel.alt}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-background/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 flex flex-col items-center text-center gap-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-xl"
        >
          <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-muted-foreground mb-4 font-medium">
            {subtitle}
          </p>
          <h1 className="font-heading text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
            {titleLine1}
            <br />
            <span className="text-gradient">{titleLine2}</span>
          </h1>
        </motion.div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-2xl">
          {actions.map((action) => {
            const hasGlow = (action as any).glow;
            return (
              <motion.div
                key={action.to}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: action.delay }}
                className="flex-1"
              >
                <Link
                  to={action.to}
                  className={cn(
                    "group flex items-center justify-between rounded-2xl border backdrop-blur-md px-6 py-5 text-base font-semibold transition-all",
                    hasGlow
                      ? "border-amber-400/40 bg-amber-400/10 text-amber-100 glow-gold hover:bg-amber-400/20 hover:border-amber-400/60"
                      : "border-border bg-card/50 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary hover:glow"
                  )}
                >
                  <span>{action.label}</span>
                  <ArrowRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="h-14 w-8 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-2 w-2 rounded-full bg-primary"
          />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
