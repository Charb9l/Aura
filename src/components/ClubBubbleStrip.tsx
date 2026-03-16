import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ClubBubble {
  id: string;
  name: string;
  logo_url: string | null;
}

interface ClubBubbleStripProps {
  title: string;
  linkTo: string;
  filterAcademy?: boolean;
}

const ClubBubbleStrip = ({ title, linkTo, filterAcademy = false }: ClubBubbleStripProps) => {
  const [clubs, setClubs] = useState<ClubBubble[]>([]);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      let query = supabase
        .from("clubs")
        .select("id, name, logo_url")
        .eq("published", true)
        .order("name");

      if (filterAcademy) {
        query = query.eq("has_academy", true);
      }

      const { data } = await query;
      if (data) setClubs(data);
    };
    fetch();
  }, [filterAcademy]);

  // Measure how many bubbles fit on one line
  useEffect(() => {
    if (!containerRef.current || clubs.length === 0) return;

    const measure = () => {
      const container = containerRef.current;
      if (!container) return;
      // bubble size: 64px (w-16) + 8px gap = 72px per bubble
      // Also reserve ~80px for the "See all" button
      const availableWidth = container.offsetWidth;
      const bubbleWidth = 72; // w-16 (64) + gap-2 (8)
      const seeAllWidth = 80;
      const maxFit = Math.floor((availableWidth - seeAllWidth) / bubbleWidth);
      setVisibleCount(Math.max(1, maxFit));
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [clubs.length]);

  if (clubs.length === 0) return null;

  const showSeeAll = visibleCount !== null && clubs.length > visibleCount;
  const displayed = visibleCount !== null ? clubs.slice(0, visibleCount) : clubs;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-border/40" />
        <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          {title}
        </h2>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-border/40" />
      </div>

      <div ref={containerRef} className="flex items-center gap-2 justify-center">
        {displayed.map((club, i) => (
          <motion.div
            key={club.id}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden flex items-center justify-center hover:border-primary/30 transition-all duration-300">
              {club.logo_url ? (
                <img
                  src={club.logo_url}
                  alt={club.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-[10px] font-medium text-muted-foreground uppercase">
                  {club.name.slice(0, 2)}
                </span>
              )}
            </div>
            <span className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground/60 text-center max-w-[60px] truncate">
              {club.name}
            </span>
          </motion.div>
        ))}

        {showSeeAll && (
          <Link
            to={linkTo}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full border border-primary/20 bg-primary/[0.06] flex items-center justify-center hover:bg-primary/[0.12] hover:border-primary/40 transition-all duration-300">
              <ArrowRight className="h-4 w-4 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-[8px] uppercase tracking-[0.15em] text-primary/60 group-hover:text-primary transition-colors">
              See all
            </span>
          </Link>
        )}
      </div>
    </motion.section>
  );
};

export default ClubBubbleStrip;
