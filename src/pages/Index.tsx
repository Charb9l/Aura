import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import PagePhotoStrip from "@/components/PagePhotoStrip";

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

      <PagePhotoStrip pageSlug="home" className="container mx-auto px-8 mt-8" />

      {/* About Us Section */}
      <section className="container mx-auto px-8 py-24 md:py-36 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl mx-auto text-center mb-24 relative"
        >
          <div className="w-12 h-[1px] bg-primary mx-auto mb-10" />
          <h2 className="font-heading text-4xl md:text-6xl font-light text-foreground mb-8 leading-[1.1]">
            {heading}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xl mx-auto">
            {intro}
          </p>
        </motion.div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 max-w-4xl mx-auto mb-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-card rounded-sm p-10 group"
          >
            <p className="text-[9px] uppercase tracking-[0.3em] text-primary mb-6 font-medium">{missionTitle}</p>
            <p className="text-muted-foreground text-sm leading-relaxed">{mission}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card rounded-sm p-10 group"
          >
            <p className="text-[9px] uppercase tracking-[0.3em] text-primary mb-6 font-medium">{visionTitle}</p>
            <p className="text-muted-foreground text-sm leading-relaxed">{vision}</p>
          </motion.div>
        </div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-4xl mx-auto relative"
        >
          <div className="text-center mb-16">
            <div className="w-8 h-[1px] bg-primary mx-auto mb-8" />
            <h3 className="font-heading text-3xl md:text-5xl font-light text-foreground">
              {valuesTitle}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="group glass-card rounded-sm p-8 transition-all duration-300 hover:bg-muted/20"
              >
                <h4 className="font-heading text-xl font-light text-foreground mb-3">{value.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
