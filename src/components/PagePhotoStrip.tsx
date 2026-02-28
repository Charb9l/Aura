import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface HeroPicture {
  id: string;
  image_url: string;
  display_order: number;
}

interface PagePhotoStripProps {
  pageSlug: string;
  className?: string;
}

const PagePhotoStrip = ({ pageSlug, className }: PagePhotoStripProps) => {
  const [images, setImages] = useState<HeroPicture[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("hero_pictures")
        .select("id, image_url, display_order")
        .eq("page_slug", pageSlug)
        .order("display_order");
      if (data) setImages(data);
    };
    fetch();
  }, [pageSlug]);

  if (images.length === 0) return null;

  const closeLightbox = () => setLightboxIndex(null);
  const next = () => setLightboxIndex(prev => prev !== null ? (prev + 1) % images.length : 0);
  const prev = () => setLightboxIndex(prev => prev !== null ? (prev - 1 + images.length) % images.length : 0);

  // Double the images for seamless infinite scroll effect
  const duplicated = [...images, ...images];

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl",
          className
        )}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Scrolling strip */}
        <div
          ref={stripRef}
          className="flex gap-3 py-2"
          style={{
            animation: `photo-scroll ${images.length * 6}s linear infinite`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        >
          {duplicated.map((img, i) => (
            <button
              key={`${img.id}-${i}`}
              onClick={() => setLightboxIndex(i % images.length)}
              className="relative shrink-0 rounded-lg overflow-hidden group/thumb cursor-pointer"
              style={{ width: 160, height: 100 }}
            >
              <img
                src={img.image_url}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-background/0 group-hover/thumb:bg-background/20 transition-colors duration-300" />
            </button>
          ))}
        </div>

        {/* Inline keyframes */}
        <style>{`
          @keyframes photo-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-5 right-5 rounded-full bg-secondary/80 p-2.5 text-foreground hover:bg-secondary transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="absolute top-5 left-1/2 -translate-x-1/2 text-sm text-muted-foreground font-medium z-10">
              {lightboxIndex + 1} / {images.length}
            </div>

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-secondary/80 p-3 text-foreground hover:bg-secondary transition-colors z-10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-secondary/80 p-3 text-foreground hover:bg-secondary transition-colors z-10"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <AnimatePresence mode="wait">
              <motion.img
                key={lightboxIndex}
                src={images[lightboxIndex]?.image_url}
                alt=""
                className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
              />
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PagePhotoStrip;
