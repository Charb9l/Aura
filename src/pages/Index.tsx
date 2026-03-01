import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import PagePhotoStrip from "@/components/PagePhotoStrip";
import { Heart, Users, Sparkles, Target, Trophy, Gamepad2, Zap } from "lucide-react";

interface AboutContent {
  about_heading?: string;
  about_intro?: string;
  about_mission_title?: string;
  about_mission?: string;
  about_vision_title?: string;
  about_vision?: string;
  about_values_title?: string;
  about_values?: { icon: string; title: string; description: string }[];
}

const iconMap: Record<string, React.ReactNode> = {
  heart: <Heart className="h-6 w-6" />,
  users: <Users className="h-6 w-6" />,
  sparkles: <Sparkles className="h-6 w-6" />,
  target: <Target className="h-6 w-6" />,
  trophy: <Trophy className="h-6 w-6" />,
  gamepad: <Gamepad2 className="h-6 w-6" />,
  zap: <Zap className="h-6 w-6" />,
};

const defaultValues = [
  { icon: "users", title: "Play Without Limits", description: "No partner? No problem. Our AI matchmaker connects you with players at your exact level, so you never miss a game." },
  { icon: "target", title: "Precision Matching", description: "Our algorithm considers skill level, playstyle, availability, and location to find you the perfect match every time." },
  { icon: "trophy", title: "Earn as You Play", description: "Collect badges across 3 levels, track your streaks, and unlock rewards — turning every session into progress." },
  { icon: "heart", title: "Community First", description: "We're building more than a facility. We're building a movement where everyone belongs, plays, and grows together." },
];

const Index = () => {
  const [content, setContent] = useState<AboutContent>({});

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase
        .from("page_content")
        .select("content")
        .eq("page_slug", "home")
        .single();
      if (data) {
        setContent((data.content as any) || {});
      }
    };
    fetchContent();
  }, []);

  const heading = content.about_heading || "Who We Are";
  const intro = content.about_intro || "Elevate Wellness Hub is a community where anyone can play any sport — even without a partner. Our AI-powered matchmaker pairs you with players at your level, while our habit tracker rewards every session with badges and milestones. It's fitness, connection, and competition — reimagined.";
  const missionTitle = content.about_mission_title || "Our Mission";
  const mission = content.about_mission || "To empower individuals of all ages and abilities to discover the joy of movement, build lasting connections, and elevate every aspect of their well-being through inclusive, high-quality sports and wellness experiences.";
  const visionTitle = content.about_vision_title || "Our Vision";
  const vision = content.about_vision || "To be the region's most loved wellness community — a place where every person who walks through our doors feels welcome, inspired, and part of something bigger than themselves.";
  const valuesTitle = content.about_values_title || "Why Elevate";
  const values = content.about_values?.length ? content.about_values : defaultValues;

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />

      <PagePhotoStrip pageSlug="home" className="container mx-auto px-6 mt-6" />

      {/* About Us Section */}
      <section className="container mx-auto px-6 py-16 md:py-24 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-20 -right-40 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-16 relative"
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" />
            More Than a Sports Facility
          </motion.div>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
            {heading.includes("We Are") ? (
              <>Who <span className="text-gradient">We Are</span></>
            ) : heading}
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
            {intro}
          </p>
        </motion.div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto mb-16 relative">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-8 relative group hover:border-primary/30 transition-colors"
          >
            <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground">{missionTitle}</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">{mission}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-8 relative group hover:border-accent/30 transition-colors"
          >
            <div className="absolute inset-0 rounded-2xl bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground">{visionTitle}</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">{vision}</p>
            </div>
          </motion.div>
        </div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-4xl mx-auto relative"
        >
          <h3 className="font-heading text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
            {valuesTitle}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                className="group flex gap-4 p-6 rounded-xl border border-border bg-card/40 hover:bg-card/70 hover:border-primary/20 transition-all hover:shadow-[0_0_30px_hsl(var(--primary)/0.08)]"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                  {iconMap[value.icon] || <Heart className="h-6 w-6" />}
                </div>
                <div>
                  <h4 className="font-heading font-bold text-foreground mb-1">{value.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
