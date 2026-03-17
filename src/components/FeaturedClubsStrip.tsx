import { motion } from "framer-motion";
import { useFeaturedClubs } from "@/hooks/useFeaturedClubs";
import { cn } from "@/lib/utils";

interface FeaturedClubsStripProps {
  variant?: "hero" | "auth" | "compact";
  className?: string;
}

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
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
          Trusted Partners
        </p>
        <div className="flex items-center gap-5 flex-wrap justify-center">
          {featuredClubs.map((fc) => (
            <div key={fc.id} className="relative group">
              <img
                src={fc.featured_image_url}
                alt={fc.club_name}
                className="h-8 w-auto object-contain opacity-50 grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-300"
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
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium whitespace-nowrap shrink-0">
          Featured
        </span>
        {featuredClubs.map((fc) => (
          <img
            key={fc.id}
            src={fc.featured_image_url}
            alt={fc.club_name}
            className="h-6 w-auto object-contain opacity-40 hover:opacity-70 transition-opacity shrink-0"
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.8 }}
      className={cn("flex flex-col items-center gap-4", className)}
    >
      <div className="flex items-center gap-3">
        <div className="h-[2px] w-10 bg-gradient-to-r from-transparent to-primary/30 rounded-full" />
        <p className="text-[11px] uppercase tracking-wide text-primary font-semibold">
          Featured Partners
        </p>
        <div className="h-[2px] w-10 bg-gradient-to-l from-transparent to-primary/30 rounded-full" />
      </div>
      <div className="flex items-center gap-6 flex-wrap justify-center">
        {featuredClubs.map((fc, i) => (
          <motion.div
            key={fc.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1 + i * 0.1, duration: 0.5 }}
            className="group relative"
          >
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-3 hover:border-primary/30 hover:shadow-lg transition-all duration-300 shadow-sm">
              <img
                src={fc.featured_image_url}
                alt={fc.club_name}
                className="h-10 w-auto object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
              />
            </div>
            <p className="text-[9px] font-medium text-muted-foreground text-center mt-1.5 group-hover:text-foreground transition-colors">
              {fc.club_name}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default FeaturedClubsStrip;
