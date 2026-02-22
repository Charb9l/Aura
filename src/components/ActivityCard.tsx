import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityCardProps {
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  logo?: string;
  slug: string;
  hasAcademy?: boolean;
  brandColor?: "basketball" | "tennis" | "wellness";
  delay?: number;
}

const brandStyles = {
  basketball: {
    btn: "bg-brand-basketball hover:shadow-[0_0_20px_hsl(262_50%_55%/0.4)]",
    border: "border-brand-basketball",
  },
  tennis: {
    btn: "bg-brand-tennis hover:shadow-[0_0_20px_hsl(212_70%_55%/0.4)]",
    border: "border-brand-tennis",
  },
  wellness: {
    btn: "bg-brand-wellness hover:shadow-[0_0_20px_hsl(100_22%_60%/0.4)]",
    border: "border-brand-wellness",
  },
};

const ActivityCard = ({ title, subtitle, description, image, logo, slug, hasAcademy, brandColor = "basketball", delay = 0 }: ActivityCardProps) => {
  const styles = brandStyles[brandColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="group relative overflow-hidden rounded-2xl glass"
    >
      <div className="aspect-[3/4] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {logo && (
        <div className="absolute top-4 right-4">
          <img src={logo} alt={subtitle || title} className="h-10 w-10 rounded-full object-cover shadow-lg" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-6">
        {subtitle && (
          <span className={cn("text-xs font-semibold uppercase tracking-wider mb-1 block", 
            brandColor === "basketball" && "text-brand-basketball",
            brandColor === "tennis" && "text-brand-tennis",
            brandColor === "wellness" && "text-brand-wellness"
          )}>
            {subtitle}
          </span>
        )}
        <h3 className="font-heading text-2xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="flex gap-3">
          <Link
            to={`/book?activity=${slug}`}
            className={cn("rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all", styles.btn)}
          >
            Book Now
          </Link>
          {hasAcademy && (
            <Link
              to={`/academy?sport=${slug}`}
              className={cn("flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-secondary", styles.border)}
            >
              <GraduationCap className="h-4 w-4" />
              Join Academy
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ActivityCard;
