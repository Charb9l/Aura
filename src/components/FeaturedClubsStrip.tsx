import { motion } from "framer-motion";
import { useFeaturedClubs } from "@/hooks/useFeaturedClubs";
import { cn } from "@/lib/utils";

interface FeaturedClubsStripProps {
  variant?: "hero" | "auth" | "compact";
  className?: string;
}

/**
 * A subtle horizontal strip showing featured partner clubs.
 * - "hero": used at bottom of home page hero (larger images, gold accent)
 * - "auth": used on login/signup page (small logos, muted)
 * - "compact": used on Book page or sidebar (tiny inline logos)
 */
const FeaturedClubsStrip = ({ variant = "hero", className }: FeaturedClubsStripProps) => {
  const { featuredClubs, loading } = useFeaturedClubs();

  if (loading || featuredClubs.length === 0) return null;

  if (variant === "auth") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className={cn("flex flex-col items-center gap-3 mt-6", className)}
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
          Trusted Partners
        </p>
        <div className="flex items-center gap-5 flex-wrap justify-center">
          {featuredClubs.map((fc) => (
            <div key={fc.id} className="relative group">
              <img
                src={fc.featured_image_url}
                alt={fc.club_name}
                className="h-8 w-auto object-contain opacity-40 grayscale hover:opacity-70 hover:grayscale-0 transition-all duration-300"
              />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-3 overflow-x-auto scrollbar-hide py-2", className)}>
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 whitespace-nowrap shrink-0">
          Featured
        </span>
        {featuredClubs.map((fc) => (
          <img
            key={fc.id}
            src={fc.featured_image_url}
            alt={fc.club_name}
            className="h-6 w-auto object-contain opacity-30 hover:opacity-60 transition-opacity shrink-0"
          />
        ))}
      </div>
    );
  }

  // Hero variant — premium strip at bottom of hero
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.8 }}
      className={cn("flex flex-col items-center gap-4", className)}
    >
      <div className="flex items-center gap-3">
        <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-primary/30" />
        <p className="text-[10px] uppercase tracking-[0.35em] text-primary/60 font-medium">
          Featured Partners
        </p>
        <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-primary/30" />
      </div>
      <div className="flex items-center gap-8 flex-wrap justify-center">
        {featuredClubs.map((fc, i) => (
          <motion.div
            key={fc.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1 + i * 0.1, duration: 0.5 }}
            className="group relative"
          >
            <div className="relative overflow-hidden rounded-sm border border-border/30 bg-card/30 backdrop-blur-sm p-3 hover:border-primary/20 transition-all duration-300">
              <img
                src={fc.featured_image_url}
                alt={fc.club_name}
                className="h-10 w-auto object-contain grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-90 transition-all duration-500"
              />
            </div>
            <p className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground/40 text-center mt-1.5 group-hover:text-muted-foreground/60 transition-colors">
              {fc.club_name}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default FeaturedClubsStrip;
