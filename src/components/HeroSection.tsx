import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import basketballImg from "@/assets/basketball-court.png";
import tennisImg from "@/assets/tennis-court.png";
import yogaImg from "@/assets/aerial-yoga-studio.png";
import pilatesImg from "@/assets/pilates-studio.png";

const panels = [
  { image: basketballImg, alt: "Basketball court" },
  { image: tennisImg, alt: "Tennis court" },
  { image: yogaImg, alt: "Aerial yoga studio" },
  { image: pilatesImg, alt: "Pilates studio" },
];

const actions = [
  { to: "/book", label: "Book a Session", delay: 0.4 },
  { to: "/academy", label: "Join Our Academy", delay: 0.5 },
  { to: "/clubs", label: "Clubs & Partners", delay: 0.6 },
];

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* 4-panel background */}
      <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-4">
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

      {/* Overlay — darker, more dramatic */}
      <div className="absolute inset-0 bg-background/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

      {/* Content — compact headline, prominent CTAs */}
      <div className="relative z-10 container mx-auto px-6 flex flex-col items-center text-center gap-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-xl"
        >
          <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-muted-foreground mb-4 font-medium">
            Movement & Mindfulness
          </p>
          <h1 className="font-heading text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
            Your Journey.
            <br />
            <span className="text-gradient">Your Space.</span>
          </h1>
        </motion.div>

        {/* Action buttons — large, stacked vertically on mobile, horizontal on desktop */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-2xl">
          {actions.map((action) => (
            <motion.div
              key={action.to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: action.delay }}
              className="flex-1"
            >
              <Link
                to={action.to}
                className="group flex items-center justify-between rounded-2xl border border-border bg-card/50 backdrop-blur-md px-6 py-5 text-base font-semibold text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary hover:glow"
              >
                <span>{action.label}</span>
                <ArrowRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>
            </motion.div>
          ))}
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
