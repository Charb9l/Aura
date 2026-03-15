import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MobileBackButton from "@/components/MobileBackButton";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const FEATURES = [
  {
    to: "/book",
    label: "Book Now",
    description: "Reserve your court or class",
    pageSlug: "book",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="10" width="34" height="30" rx="4" />
        <path d="M7 20h34" />
        <path d="M16 6v8M32 6v8" />
        <circle cx="24" cy="30" r="5" fill="currentColor" fillOpacity="0.12" />
        <path d="M22 30l2 2 4-4" />
      </svg>
    ),
  },
  {
    to: "/loyalty",
    label: "Loyalty",
    description: "Earn rewards & badges",
    pageSlug: "loyalty",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="24,4 29,18 44,18 32,27 36,42 24,33 12,42 16,27 4,18 19,18" fill="currentColor" fillOpacity="0.08" />
        <polygon points="24,4 29,18 44,18 32,27 36,42 24,33 12,42 16,27 4,18 19,18" />
        <circle cx="24" cy="24" r="5" fill="currentColor" fillOpacity="0.12" />
      </svg>
    ),
  },
  {
    to: "/academy",
    label: "Academies",
    description: "Train with the best coaches",
    pageSlug: "academy",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 6l18 10v4L24 30 6 20v-4L24 6z" fill="currentColor" fillOpacity="0.08" />
        <path d="M24 6l18 10-18 10L6 16 24 6z" />
        <path d="M42 20v12" />
        <path d="M12 24v10c0 2 5 6 12 6s12-4 12-6V24" />
        <circle cx="42" cy="34" r="2" fill="currentColor" fillOpacity="0.2" />
      </svg>
    ),
  },
  {
    to: "/clubs",
    label: "Our Clubs",
    description: "Explore partner venues",
    pageSlug: "clubs",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 42V18l16-12 16 12v24H8z" />
        <path d="M18 42V30h12v12" />
        <circle cx="24" cy="22" r="4" fill="currentColor" fillOpacity="0.12" />
        <path d="M4 20l20-16 20 16" />
      </svg>
    ),
  },
  {
    to: "/matchmaker",
    label: "Matchmaker",
    description: "Find your perfect partner",
    pageSlug: "matchmaker",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="17" cy="16" r="7" />
        <circle cx="31" cy="16" r="7" />
        <path d="M6 40c0-7 5-12 11-12h2" />
        <path d="M42 40c0-7-5-12-11-12h-2" />
        <path d="M20 30l4-3 4 3" fill="currentColor" fillOpacity="0.12" />
        <circle cx="24" cy="36" r="2" fill="currentColor" fillOpacity="0.2" />
      </svg>
    ),
  },
  {
    to: "/habits",
    label: "Habit Tracker",
    description: "AI-powered fitness habits",
    pageSlug: "habits",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 38L14 20l8 12 6-18 8 10h6" />
        <circle cx="14" cy="20" r="2.5" fill="currentColor" fillOpacity="0.15" />
        <circle cx="22" cy="32" r="2.5" fill="currentColor" fillOpacity="0.15" />
        <circle cx="28" cy="14" r="2.5" fill="currentColor" fillOpacity="0.15" />
        <circle cx="36" cy="24" r="2.5" fill="currentColor" fillOpacity="0.15" />
        <path d="M40 10l2-2M42 14h3M40 18l2 2" strokeWidth="1.2" />
      </svg>
    ),
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const Community = () => {
  const [bgImages, setBgImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const slugs = FEATURES.map((f) => f.pageSlug);
    supabase
      .from("hero_pictures")
      .select("image_url, page_slug, display_order")
      .in("page_slug", slugs)
      .order("display_order")
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        // Pick the first image per slug
        for (const row of data) {
          if (!map[row.page_slug]) {
            map[row.page_slug] = row.image_url;
          }
        }
        setBgImages(map);
      });
  }, []);

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <Navbar />
      <div className="px-4 pt-4 sm:hidden">
        <MobileBackButton fallbackPath="/" />
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
        <h1 className="text-2xl font-heading tracking-wide text-foreground mb-1">Community</h1>
        <p className="text-xs text-muted-foreground mb-6 tracking-wider uppercase">Everything in one place</p>

        <motion.div
          className="grid grid-cols-2 gap-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {FEATURES.map((f) => {
            const bg = bgImages[f.pageSlug];
            return (
              <motion.div key={f.to} variants={item}>
                <Link
                  to={f.to}
                  className="group relative flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-5 text-center transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)] active:scale-[0.97] overflow-hidden min-h-[140px]"
                >
                  {/* Background photo */}
                  {bg && (
                    <div className="absolute inset-0 z-0">
                      <img
                        src={bg}
                        alt=""
                        className="w-full h-full object-cover opacity-20 transition-opacity duration-500 group-hover:opacity-30"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-card/40" />
                    </div>
                  )}

                  {/* Subtle corner accent */}
                  <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden rounded-tr-xl z-10">
                    <div className="absolute top-0 right-0 w-12 h-[1px] bg-gradient-to-l from-primary/40 to-transparent origin-top-right rotate-0" />
                    <div className="absolute top-0 right-0 h-12 w-[1px] bg-gradient-to-b from-primary/40 to-transparent" />
                  </div>

                  <div className="relative z-10 text-primary transition-transform duration-300 group-hover:scale-110">
                    {f.icon}
                  </div>
                  <span className="relative z-10 text-xs font-medium tracking-wider uppercase text-foreground">{f.label}</span>
                  <span className="relative z-10 text-[10px] text-muted-foreground leading-tight">{f.description}</span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default Community;
