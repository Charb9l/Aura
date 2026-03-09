import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Star, Gift, Zap, Trophy, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OfferingItem {
  id: string;
  name: string;
  logo_url: string | null;
}

const LoyaltyPage = () => {
  const [title, setTitle] = useState("Book More. Earn More.");
  const [subtitle, setSubtitle] = useState("Every booking earns you a point. Stack them up and unlock exclusive discounts — or go big and play for free.");
  const [offerings, setOfferings] = useState<OfferingItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [contentRes, offeringsRes] = await Promise.all([
        supabase.from("page_content").select("content").eq("page_slug", "loyalty").maybeSingle(),
        supabase.from("offerings").select("id, name, logo_url").order("name"),
      ]);
      if (contentRes.data?.content) {
        const c = contentRes.data.content as any;
        if (c.title) setTitle(c.title);
        if (c.subtitle) setSubtitle(c.subtitle);
      }
      if (offeringsRes.data) setOfferings(offeringsRes.data);
    };
    fetchData();
  }, []);

  const steps = [
    { icon: <Star className="h-5 w-5" />, number: "01", title: "BOOK & EARN", desc: "Every session booked through the app earns you 1 point for that activity." },
    { icon: <Gift className="h-5 w-5" />, number: "02", title: "5 PTS → 50% OFF", desc: "Reach 5 points in any activity and your next booking is half price." },
    { icon: <Zap className="h-5 w-5" />, number: "03", title: "10 PTS → FREE", desc: "Save up to 10 points and get a completely free booking — any activity." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero — cinematic, angular */}
      <section className="relative pt-28 pb-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>

        <div className="container mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-12"
          >
            <div className="flex-1 text-center md:text-left">
              <span className="inline-block text-[10px] uppercase tracking-[0.35em] text-primary font-medium mb-4">
                Summit Rewards Program
              </span>
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light text-foreground leading-[0.95]">
                {title.split(". ").length > 1 ? (
                  <>
                    {title.split(". ")[0]}.{" "}
                    <span className="text-primary italic">{title.split(". ").slice(1).join(". ")}</span>
                  </>
                ) : (
                  <span className="text-primary italic">{title}</span>
                )}
              </h1>
              <p className="text-muted-foreground text-sm max-w-md mt-3 leading-relaxed font-light md:mx-0 mx-auto">
                {subtitle}
              </p>
            </div>

            <Link to="/profile" className="shrink-0">
              <Button
                variant="outline"
                className="h-10 px-6 text-[10px] uppercase tracking-[0.2em] font-medium border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-500"
              >
                View My Loyalty
                <ChevronRight className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How it works — editorial grid */}
      <section className="border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="py-10">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 mb-8"
            >
              <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-medium whitespace-nowrap">How It Works</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
            </motion.div>

            <div className="grid md:grid-cols-3 gap-0 md:divide-x md:divide-border/30">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="relative px-8 py-6 group"
                >
                  <div className="flex items-start gap-4 mb-5">
                    <span className="text-3xl font-heading font-light text-primary/30 leading-none">{step.number}</span>
                    <div className="w-8 h-8 border border-primary/30 flex items-center justify-center text-primary mt-1 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="text-xs uppercase tracking-[0.25em] font-medium text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed font-light">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Progress tracker — sharp, linear */}
      <section className="border-t border-border/50">
        <div className="container mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-medium whitespace-nowrap">Your Journey</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
            </div>

            <div className="max-w-4xl mx-auto">
              {/* Milestone bar */}
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  {Array.from({ length: 10 }, (_, i) => {
                    const isMilestone5 = i === 4;
                    const isMilestone10 = i === 9;
                    return (
                      <div key={i} className="flex flex-col items-center">
                        <div
                          className={`
                            w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-[10px] sm:text-xs font-medium transition-all
                            ${isMilestone5
                              ? "border-2 border-primary bg-primary/10 text-primary"
                              : isMilestone10
                              ? "border-2 border-primary bg-primary text-primary-foreground"
                              : "border border-border/60 text-muted-foreground/60 hover:border-primary/30 hover:text-primary/50"
                            }
                          `}
                        >
                          {i + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Track line */}
                <div className="h-[2px] bg-border/40 relative">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "50%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary/60 to-primary"
                  />
                </div>

                <div className="flex justify-between mt-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">Start</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-primary/80">50% Off</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Free Session</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Activities marquee — sleek */}
      {offerings.length > 0 && (
        <section className="border-t border-border/50 py-12 overflow-hidden">
          <div className="container mx-auto px-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-medium whitespace-nowrap">Every Activity Counts</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />

            <motion.div
              className="flex gap-4 w-max"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: Math.max(offerings.length * 5, 20), repeat: Infinity, ease: "linear" }}
            >
              {[...offerings, ...offerings].map((a, i) => (
                <div
                  key={`${a.id}-${i}`}
                  className="flex items-center gap-4 border border-border/40 bg-card/50 px-6 py-4 shrink-0 hover:border-primary/30 transition-all duration-500 group"
                >
                  <div className="w-11 h-11 overflow-hidden bg-secondary/50 shrink-0 border border-border/30">
                    {a.logo_url ? (
                      <img src={a.logo_url} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Trophy className="h-4 w-4 text-primary/30" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] font-medium text-foreground whitespace-nowrap">{a.name}</p>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap tracking-wide">1 booking = 1 point</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA — minimal, sharp */}
      <section className="border-t border-border/50">
        <div className="container mx-auto px-6 py-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-medium mb-6 inline-block">Begin Today</span>
            <h2 className="font-heading text-3xl md:text-5xl font-light text-foreground mb-4">
              Ready to Start <span className="text-primary italic">Earning</span>?
            </h2>
            <p className="text-muted-foreground text-sm font-light mb-10 max-w-md mx-auto">
              Sign up, book your first session, and watch your points grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/auth">
                <Button
                  variant="outline"
                  className="h-11 px-8 text-xs uppercase tracking-[0.2em] font-medium border-border/60 text-foreground hover:border-primary/50 hover:text-primary transition-all duration-500"
                >
                  Create Account
                </Button>
              </Link>
              <Link to="/book">
                <Button className="h-11 px-8 text-xs uppercase tracking-[0.2em] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-500">
                  Book Now
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border/30 py-10">
        <div className="container mx-auto px-6 text-center text-[11px] uppercase tracking-[0.25em] text-muted-foreground/40">
          © {new Date().getFullYear()} Summit. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LoyaltyPage;
