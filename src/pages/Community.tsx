import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MobileBackButton from "@/components/MobileBackButton";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface SpaceCategory {
  title: string;
  subtitle: string;
  to: string;
  image_url: string;
}

interface SpaceContent {
  title: string;
  subtitle: string;
  categories: SpaceCategory[];
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const Community = () => {
  const [content, setContent] = useState<SpaceContent | null>(null);

  useEffect(() => {
    supabase
      .from("page_content")
      .select("content")
      .eq("page_slug", "community")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.content) setContent(data.content as unknown as SpaceContent);
      });
  }, []);

  const title = content?.title || "Your Space";
  const subtitle = content?.subtitle || "EVERYTHING IN ONE PLACE";
  const categories = content?.categories || [];

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <Navbar />
      <div className="px-4 pt-4 sm:hidden">
        <MobileBackButton fallbackPath="/" />
      </div>

      <div className="max-w-lg mx-auto px-6 page-offset-top pb-8 flex flex-col items-center">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-heading font-bold tracking-tight text-foreground text-center"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-[10px] text-primary font-semibold tracking-[0.3em] uppercase mt-1.5 mb-8 text-center"
        >
          {subtitle}
        </motion.p>

        <motion.div
          className="grid grid-cols-2 gap-4 w-full"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {categories.map((cat, i) => (
            <motion.div key={i} variants={item}>
              <Link
                to={cat.to}
                className="group flex flex-col items-center text-center"
              >
                {/* Oval image */}
                <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-white/[0.04] backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-500 group-hover:shadow-[0_0_24px_rgba(124,58,237,0.25)] group-hover:scale-[1.03]">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-4xl">
                      ✦
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                  {/* Text overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm font-semibold text-foreground leading-tight">{cat.title}</p>
                    <p className="text-[10px] text-foreground/50 mt-0.5">{cat.subtitle}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Community;
