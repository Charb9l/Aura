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

const ActivityCard = ({ title, subtitle, description, image, logo, slug, hasAcademy, delay = 0 }: ActivityCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay }}
      className="group relative overflow-hidden rounded-sm glass-card"
    >
      <div className="aspect-[3/4] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 saturate-[0.4] contrast-[1.1] group-hover:saturate-[0.7]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {logo && (
        <div className="absolute top-6 right-6">
          <img src={logo} alt={subtitle || title} className="h-10 w-10 rounded-full object-cover opacity-60" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-8">
        {subtitle && (
          <span className="text-[9px] font-medium uppercase tracking-[0.3em] mb-2 block text-primary">
            {subtitle}
          </span>
        )}
        <h3 className="font-heading text-3xl font-light text-foreground mb-3">{title}</h3>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">{description}</p>
        <div className="flex gap-4">
          <Link
            to={`/book?activity=${slug}`}
            className="rounded-sm border border-primary/30 bg-primary/5 px-6 py-2.5 text-[10px] font-medium uppercase tracking-[0.15em] text-primary transition-all hover:bg-primary/10"
          >
            Book Now
          </Link>
          {hasAcademy && (
            <Link
              to={`/academy?sport=${slug}`}
              className="flex items-center gap-2 rounded-sm border border-border px-6 py-2.5 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground transition-all hover:text-foreground hover:border-foreground/20"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Academy
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ActivityCard;
