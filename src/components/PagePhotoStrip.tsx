import { useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchImages = async () => {
      const { data } = await supabase
        .from("hero_pictures")
        .select("id, image_url, display_order")
        .eq("page_slug", pageSlug)
        .order("display_order");
      if (data) setImages(data);
    };
    fetchImages();
  }, [pageSlug]);

  if (images.length === 0) return null;

  const closeLightbox = () => setLightboxIndex(null);
  const next = () => setLightboxIndex(prev => prev !== null ? (prev + 1) % images.length : 0);
  const prev = () => setLightboxIndex(prev => prev !== null ? (prev - 1 + images.length) % images.length : 0);

  // Build masonry columns (3 cols on desktop, 2 on tablet)
  const getSpanClass = (index: number) => {
    const pattern = index % 6;
    // Alternate tall and wide items for visual interest
    if (pattern === 0) return "row-span-2"; // tall
    if (pattern === 3) return "col-span-2"; // wide (on md+)
    return "";
  };

  return (
    <>
      <div className={cn("", className)}>
        <div className="grid grid-cols-2 md:grid-cols-3 auto-rows-[180px] md:auto-rows-[200px] gap-3">
          {images.map((img, i) => (
            <motion.button
              key={img.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              onClick={() => setLightboxIndex(i)}
              className={cn(
                "relative rounded-xl overflow-hidden group cursor-pointer",
                getSpanClass(i),
                // Wide items only span 2 cols on md+
                i % 6 === 3 && "md:col-span-2 col-span-1"
              )}
            >
              <img
                src={img.image_url}
                alt=""
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
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
