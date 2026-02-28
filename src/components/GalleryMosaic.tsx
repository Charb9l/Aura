import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryMosaicProps {
  images: { id: string; image_url: string }[];
  alt?: string;
  fallback?: React.ReactNode;
  className?: string;
}

const GalleryMosaic = ({ images, alt = "Gallery", fallback, className }: GalleryMosaicProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return fallback ? <>{fallback}</> : null;
  }

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const next = () => setLightboxIndex(prev => prev !== null ? (prev + 1) % images.length : 0);
  const prev = () => setLightboxIndex(prev => prev !== null ? (prev - 1 + images.length) % images.length : 0);

  return (
    <>
      {/* Mosaic Grid */}
      <div className={cn("w-full", className)}>
        {images.length === 1 && (
          <button
            onClick={() => openLightbox(0)}
            className="relative w-full aspect-[16/9] overflow-hidden rounded-t-lg group"
          >
            <img src={images[0].image_url} alt={alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-foreground opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
            </div>
          </button>
        )}

        {images.length === 2 && (
          <div className="grid grid-cols-2 gap-1 rounded-t-lg overflow-hidden">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => openLightbox(i)}
                className="relative aspect-[4/3] overflow-hidden group"
              >
                <img src={img.image_url} alt={alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center">
                  <ZoomIn className="h-6 w-6 text-foreground opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
                </div>
              </button>
            ))}
          </div>
        )}

        {images.length === 3 && (
          <div className="grid grid-cols-3 grid-rows-2 gap-1 rounded-t-lg overflow-hidden h-[340px]">
            <button
              onClick={() => openLightbox(0)}
              className="relative col-span-2 row-span-2 overflow-hidden group"
            >
              <img src={images[0].image_url} alt={alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-foreground opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
              </div>
            </button>
            {images.slice(1).map((img, i) => (
              <button
                key={img.id}
                onClick={() => openLightbox(i + 1)}
                className="relative overflow-hidden group"
              >
                <img src={img.image_url} alt={alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center">
                  <ZoomIn className="h-5 w-5 text-foreground opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
                </div>
              </button>
            ))}
          </div>
        )}

        {images.length >= 4 && (
          <div className="grid grid-cols-4 grid-rows-2 gap-1 rounded-t-lg overflow-hidden h-[340px]">
            <button
              onClick={() => openLightbox(0)}
              className="relative col-span-2 row-span-2 overflow-hidden group"
            >
              <img src={images[0].image_url} alt={alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-foreground opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
              </div>
            </button>
            {images.slice(1, 4).map((img, i) => (
              <button
                key={img.id}
                onClick={() => openLightbox(i + 1)}
                className={cn(
                  "relative overflow-hidden group",
                  i === 0 ? "col-span-2" : ""
                )}
              >
                <img src={img.image_url} alt={alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center">
                  <ZoomIn className="h-5 w-5 text-foreground opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
                </div>
                {/* Show remaining count on last visible tile */}
                {i === 2 && images.length > 4 && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <span className="text-foreground font-heading text-2xl font-bold">+{images.length - 4}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
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
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute top-5 right-5 rounded-full bg-secondary/80 p-2.5 text-foreground hover:bg-secondary transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Counter */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 text-sm text-muted-foreground font-medium z-10">
              {lightboxIndex + 1} / {images.length}
            </div>

            {/* Navigation */}
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

            {/* Image */}
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

            {/* Thumbnail strip */}
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
