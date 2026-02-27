import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Star, Gift, Zap, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";

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

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-5 py-2 mb-6"
            >
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Rewards Program</span>
            </motion.div>

            <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-4">
              {title.split(". ").length > 1 ? (
                <>{title.split(". ")[0]}. <span className="text-gradient">{title.split(". ").slice(1).join(". ")}</span></>
              ) : (
                <span className="text-gradient">{title}</span>
              )}
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-8">
              {subtitle}
            </p>

            <Link to="/book">
              <Button className="h-14 px-10 text-lg font-bold rounded-xl glow">
                Start Earning <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-6 pb-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-3xl md:text-4xl font-bold text-foreground text-center mb-14"
        >
          How It <span className="text-gradient">Works</span>
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {[
            {
              icon: <Star className="h-8 w-8" />,
              title: "Book & Earn",
              desc: "Every time you book a session through the app, you earn 1 point for that activity.",
              delay: 0,
            },
            {
              icon: <Gift className="h-8 w-8" />,
              title: "5 Points = 50% Off",
              desc: "Reach 5 points in any activity and your next booking in that sport is half price.",
              delay: 0.1,
            },
            {
              icon: <Zap className="h-8 w-8" />,
              title: "10 Points = FREE",
              desc: "Save up to 10 points and get a completely free booking — any activity you want.",
              delay: 0.2,
            },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: step.delay }}
              className="relative rounded-2xl border border-border bg-card p-8 text-center group hover:border-primary/30 transition-colors"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                {i + 1}
              </div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-5 mt-2">
                {step.icon}
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Milestones visual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto mb-20"
        >
          <h3 className="font-heading text-2xl font-bold text-foreground text-center mb-8">Your Journey Per Activity</h3>
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="flex items-center justify-between mb-4">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                      i < 5
                        ? "border-primary/30 bg-primary/5 text-primary/60"
                        : i < 10
                        ? "border-accent/30 bg-accent/5 text-accent/60"
                        : ""
                    } ${i === 4 ? "border-primary bg-primary/20 text-primary ring-2 ring-primary/20" : ""}
                    ${i === 9 ? "border-accent bg-accent/20 text-accent ring-2 ring-accent/20" : ""}`}
                  >
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
            <div className="h-2 rounded-full bg-secondary relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-primary/40 to-primary rounded-full" />
            </div>
            <div className="flex justify-between mt-3">
              <span className="text-xs text-muted-foreground">Start</span>
              <span className="text-xs text-primary font-medium">5 pts — 50% off</span>
              <span className="text-xs text-accent font-medium">10 pts — FREE 🎉</span>
            </div>
          </div>
        </motion.div>

        {/* Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="font-heading text-2xl font-bold text-foreground text-center mb-8">
            Earn Points In <span className="text-gradient">Every Activity</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {offerings.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-xl overflow-hidden aspect-[3/4] group bg-secondary"
              >
                {a.logo_url ? (
                  <img src={a.logo_url} alt={a.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/10">
                    <Trophy className="h-10 w-10 text-primary/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-heading font-bold text-foreground text-sm">{a.name}</p>
                  <p className="text-xs text-muted-foreground">1 booking = 1 point</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Sign up, book your first session, and watch your points grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button variant="outline" className="h-12 px-8 rounded-xl font-bold">Create Account</Button>
            </Link>
            <Link to="/book">
              <Button className="h-12 px-8 rounded-xl font-bold glow">Book Now</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Courtside. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LoyaltyPage;
