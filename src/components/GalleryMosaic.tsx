import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryMosaicProps {
  images: { id: string; image_url: string }[];
  alt?: string;
  fallback?: React.ReactNode;
  className?: string;
}

const GalleryMosaic = ({ images, alt = "Gallery", fallback, className }: GalleryMosaicProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return fallback ? <>{fallback}</> : null;
  }

  const closeLightbox = () => setLightboxIndex(null);
  const next = () => setLightboxIndex(prev => prev !== null ? (prev + 1) % images.length : 0);
  const prev = () => setLightboxIndex(prev => prev !== null ? (prev - 1 + images.length) % images.length : 0);

  const scrollBy = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  return (
    <>
      {/* Horizontal filmstrip */}
      <div className={cn("relative group/strip", className)}>
        {/* Scroll arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => scrollBy("left")}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm p-2 text-foreground shadow-lg sm:opacity-0 sm:group-hover/strip:opacity-100 transition-opacity hover:bg-background"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollBy("right")}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm p-2 text-foreground shadow-lg sm:opacity-0 sm:group-hover/strip:opacity-100 transition-opacity hover:bg-background"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth py-1 px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {images.map((img, i) => (
            <motion.button
              key={img.id}
              onClick={() => setLightboxIndex(i)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "relative shrink-0 rounded-lg overflow-hidden group/img cursor-pointer",
                images.length === 1 ? "w-full" : "w-[280px]"
              )}
            >
              <img
                src={img.image_url}
                alt={alt}
                className={cn(
                  "object-cover transition-transform duration-500 group-hover/img:scale-105",
                  images.length === 1 ? "w-full h-[300px]" : "w-[280px] h-[200px]"
                )}
              />
              <div className="absolute inset-0 bg-background/0 group-hover/img:bg-background/10 transition-colors" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lightbox Overlay */}
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
                alt={alt}
                className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
              />
            </AnimatePresence>

            {images.length > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                    className={cn(
                      "h-12 w-16 rounded-md overflow-hidden border-2 transition-all",
                      i === lightboxIndex ? "border-primary opacity-100 scale-110" : "border-transparent opacity-50 hover:opacity-80"
                    )}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GalleryMosaic;
