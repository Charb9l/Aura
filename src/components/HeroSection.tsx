import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroBg from "@/assets/basketball-court.png";
import beirutLogo from "@/assets/beirut-logo.png";
import hardcourtLogo from "@/assets/hardcourt-logo.png";
import enformeLogo from "@/assets/enforme-logo.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="Beirut Sports Club basketball court" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Brand logos */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center gap-6 md:gap-10 mb-10"
          >
            <img src={beirutLogo} alt="Beirut Sports Club" className="h-16 md:h-24 w-auto drop-shadow-2xl" />
            <img src={hardcourtLogo} alt="Hard Court Tennis" className="h-16 md:h-24 w-auto drop-shadow-2xl" />
            <img src={enformeLogo} alt="En Forme Studio" className="h-16 md:h-24 w-auto drop-shadow-2xl" />
          </motion.div>

          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground mb-6">
            YOUR GAME.
            <br />
            <span className="text-gradient">YOUR COURT.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Book tennis courts, basketball courts, aerial yoga for kids, or reformer pilates sessions — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/book"
              className="rounded-xl bg-primary px-8 py-4 text-lg font-bold text-primary-foreground transition-all hover:glow glow-lg"
            >
              Book a Session
            </Link>
            <Link
              to="/academy"
              className="rounded-xl border border-border px-8 py-4 text-lg font-medium text-foreground transition-all hover:bg-secondary"
            >
              Join Our Academy
            </Link>
          </div>
        </motion.div>
      </div>

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
