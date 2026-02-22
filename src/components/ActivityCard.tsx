import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

interface ActivityCardProps {
  title: string;
  description: string;
  image: string;
  slug: string;
  hasAcademy?: boolean;
  delay?: number;
}

const ActivityCard = ({ title, description, image, slug, hasAcademy, delay = 0 }: ActivityCardProps) => {
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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="font-heading text-2xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="flex gap-3">
          <Link
            to={`/book?activity=${slug}`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:glow"
          >
            Book Now
          </Link>
          {hasAcademy && (
            <Link
              to={`/academy?sport=${slug}`}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-secondary"
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
