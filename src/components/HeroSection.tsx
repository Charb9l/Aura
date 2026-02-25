import { motion } from "framer-motion";
import { Link } from "react-router-dom";

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

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 4-panel background */}
      <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-4">
        {panels.map((panel, i) => (
          <div key={i} className="relative overflow-hidden">
            <img
              src={panel.image}
              alt={panel.alt}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="font-heading text-4xl md:text-6xl lg:text-8xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
            YOUR JOURNEY. YOUR SPACE.
            <br />
            MOVEMENT & <span className="text-gradient">MINDFULNESS.</span>
          </h1>
          <p className="text-base md:text-xl text-foreground/80 font-medium max-w-2xl mx-auto mb-10">
            Book tennis courts, basketball courts, aerial yoga for kids, or reformer
            pilates sessions — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/book"
              className="rounded-full border border-border bg-card/60 backdrop-blur-sm px-8 py-4 text-lg font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-secondary"
            >
              Book a Session
            </Link>
            <Link
              to="/academy"
              className="rounded-full border border-border bg-card/60 backdrop-blur-sm px-8 py-4 text-lg font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-secondary"
            >
              Join Our Academy
            </Link>
            <Link
              to="/clubs"
              className="rounded-full border border-border bg-card/60 backdrop-blur-sm px-8 py-4 text-lg font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-secondary"
            >
              Our Clubs &amp; Partners
            </Link>
          </div>
        </motion.div>
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
