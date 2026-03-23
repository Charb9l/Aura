import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LoyaltyIcon } from "@/components/icons/BrandIcons";

interface OfferingItem {
  id: string;
  name: string;
  logo_url: string | null;
}

const DEFAULT_STEPS = [
  { title: "BOOK & EARN", desc: "Every session booked through the app earns you 1 point for that activity." },
  { title: "5 PTS → 50% OFF", desc: "Reach 5 points in any activity and your next booking is half price." },
  { title: "10 PTS → FREE", desc: "Save up to 10 points and get a completely free booking — any activity." },
];

/** Custom step icons — inline SVGs matching the premium aesthetic */
const StepBookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12,2 14.5,8.5 21.5,8.5 16,12.5 18,19.5 12,15.5 6,19.5 8,12.5 2.5,8.5 9.5,8.5" fill="currentColor" fillOpacity="0.08" />
    <polygon points="12,2 14.5,8.5 21.5,8.5 16,12.5 18,19.5 12,15.5 6,19.5 8,12.5 2.5,8.5 9.5,8.5" />
  </svg>
);

const StepRewardIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M12 10V4" />
    <path d="M8 4c0 0 0 3 4 6" />
    <path d="M16 4c0 0 0 3-4 6" />
    <line x1="4" y1="15" x2="20" y2="15" />
  </svg>
);

const StepFreeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill="currentColor" fillOpacity="0.08" />
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
);

const STEP_ICONS = [
  <StepBookIcon className="h-5 w-5" />,
  <StepRewardIcon className="h-5 w-5" />,
  <StepFreeIcon className="h-5 w-5" />,
];

const LoyaltyPage = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("Book More. Earn More.");
  const [subtitle, setSubtitle] = useState("Every booking earns you a point. Stack them up and unlock exclusive discounts — or go big and play for free.");
  const [tagline, setTagline] = useState("Summit Rewards Program");
  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const [sectionHow, setSectionHow] = useState("How It Works");
  const [sectionJourney, setSectionJourney] = useState("Your Journey");
  const [sectionActivities, setSectionActivities] = useState("Every Activity Counts");
  const [ctaTagline, setCtaTagline] = useState("Begin Today");
  const [ctaHeading, setCtaHeading] = useState("Ready to Start Earning?");
  const [ctaSubtitle, setCtaSubtitle] = useState("Sign up, book your first session, and watch your points grow.");
  const [milestone5, setMilestone5] = useState("50% Off");
  const [milestone10, setMilestone10] = useState("Free Session");
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
        if (c.tagline) setTagline(c.tagline);
        if (c.steps?.length) setSteps(c.steps);
        if (c.section_how) setSectionHow(c.section_how);
        if (c.section_journey) setSectionJourney(c.section_journey);
        if (c.section_activities) setSectionActivities(c.section_activities);
        if (c.cta_tagline) setCtaTagline(c.cta_tagline);
        if (c.cta_heading) setCtaHeading(c.cta_heading);
        if (c.cta_subtitle) setCtaSubtitle(c.cta_subtitle);
        if (c.milestone_5) setMilestone5(c.milestone_5);
        if (c.milestone_10) setMilestone10(c.milestone_10);
      }
      if (offeringsRes.data) setOfferings(offeringsRes.data);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      {/* Hero */}
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
                {tagline}
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

      {/* How it works */}
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
              <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-medium whitespace-nowrap">{sectionHow}</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
            </motion.div>

            <div className="grid md:grid-cols-3 gap-0 md:divide-x md:divide-border/30">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="relative px-6 py-4 group"
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 border border-primary/30 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                      {STEP_ICONS[i] || <StepBookIcon className="h-5 w-5" />}
                    </div>
                    <h3 className="text-xs uppercase tracking-[0.25em] font-medium text-foreground">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed font-light pl-11">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Progress tracker */}
      <section className="border-t border-border/50">
        <div className="container mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-medium whitespace-nowrap">{sectionJourney}</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
            </div>

            <div className="max-w-4xl mx-auto">
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
                  <span className="text-[10px] uppercase tracking-[0.2em] text-primary/80">{milestone5}</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">{milestone10}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Activities marquee */}
      {offerings.length > 0 && (
        <section className="border-t border-border/50 py-12 overflow-hidden max-w-full">
          <div className="container mx-auto px-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-medium whitespace-nowrap">{sectionActivities}</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
            </div>
          </div>

          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />

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

      {/* CTA */}
      <section className="border-t border-border/50">
        <div className="container mx-auto px-6 py-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-medium mb-6 inline-block">{ctaTagline}</span>
            <h2 className="font-heading text-3xl md:text-5xl font-light text-foreground mb-4">
              {ctaHeading.includes(" ") ? (
                <>
                  {ctaHeading.split(" ").slice(0, -1).join(" ")}{" "}
                  <span className="text-primary italic">{ctaHeading.split(" ").slice(-1)}</span>
                </>
              ) : (
                ctaHeading
              )}
            </h2>
            {!user && (
              <>
                <p className="text-muted-foreground text-sm font-light mb-10 max-w-md mx-auto">
                  {ctaSubtitle}
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
              </>
            )}
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border/30 py-10">
        <div className="container mx-auto px-6 text-center text-[11px] uppercase tracking-[0.25em] text-muted-foreground/40">
          © {new Date().getFullYear()} All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LoyaltyPage;