import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import PagePhotoStrip from "@/components/PagePhotoStrip";
import { Heart, Users, Sparkles, Target } from "lucide-react";

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
};

const defaultValues = [
  { icon: "heart", title: "Wellness for All", description: "We believe movement and mindfulness should be accessible to everyone, regardless of age or experience." },
  { icon: "users", title: "Community First", description: "We build connections through sport, creating a supportive environment where everyone belongs." },
  { icon: "sparkles", title: "Holistic Growth", description: "Beyond physical fitness, we nurture mental well-being, social bonds, and personal development." },
  { icon: "target", title: "Excellence with Heart", description: "We strive for the highest standards in coaching, facilities, and service — all with genuine warmth." },
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
  const intro = content.about_intro || "Elevate Wellness Hub is more than a sports facility — it's a movement. Born from the belief that wellness is a community journey, we bring together world-class athletics, mindful movement, and genuine human connection under one roof.";
  const missionTitle = content.about_mission_title || "Our Mission";
  const mission = content.about_mission || "To empower individuals of all ages and abilities to discover the joy of movement, build lasting connections, and elevate every aspect of their well-being through inclusive, high-quality sports and wellness experiences.";
  const visionTitle = content.about_vision_title || "Our Vision";
  const vision = content.about_vision || "To be the region's most loved wellness community — a place where every person who walks through our doors feels welcome, inspired, and part of something bigger than themselves.";
  const valuesTitle = content.about_values_title || "What We Stand For";
  const values = content.about_values?.length ? content.about_values : defaultValues;

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />

      <PagePhotoStrip pageSlug="home" className="container mx-auto px-6 mt-6" />

      {/* About Us Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 max-w-4xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground">{missionTitle}</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">{mission}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground">{visionTitle}</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">{vision}</p>
          </motion.div>
        </div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <h3 className="font-heading text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
            {valuesTitle}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                className="flex gap-4 p-6 rounded-xl border border-border bg-card/40 hover:bg-card/70 transition-colors"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
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
