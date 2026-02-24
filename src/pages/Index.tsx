import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ActivityCard from "@/components/ActivityCard";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface OfferingData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface ClubData {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  offerings: string[];
}

const activityKeywords: Record<string, string[]> = {
  basketball: ["basketball"],
  tennis: ["tennis"],
  pilates: ["pilates"],
  "aerial-yoga": ["yoga", "aerial"],
};

const brandForSlug = (slug: string): "basketball" | "tennis" | "wellness" => {
  if (slug === "tennis") return "tennis";
  if (slug === "basketball") return "basketball";
  return "wellness";
};

const academySlugs = ["tennis", "basketball"];

const Index = () => {
  const [offerings, setOfferings] = useState<OfferingData[]>([]);
  const [clubs, setClubs] = useState<ClubData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [offRes, clubRes] = await Promise.all([
        supabase.from("offerings").select("*").order("name"),
        supabase.from("clubs").select("*").order("name"),
      ]);
      if (offRes.data) setOfferings(offRes.data as unknown as OfferingData[]);
      if (clubRes.data) setClubs(clubRes.data as unknown as ClubData[]);
    };
    fetchData();
  }, []);

  // Build activities from offerings + clubs
  const activities = offerings.map((offering) => {
    // Find the club that offers this activity
    const keywords = activityKeywords[offering.slug] || [offering.slug];
    const club = clubs.find(c =>
      c.offerings.some(o => keywords.some(k => o.toLowerCase().includes(k)))
    );
    return {
      title: offering.name,
      subtitle: club?.name || "",
      description: "",
      image: offering.logo_url || "",
      logo: club?.logo_url?.startsWith("http") ? club.logo_url : "",
      slug: offering.slug,
      hasAcademy: academySlugs.includes(offering.slug),
      brandColor: brandForSlug(offering.slug),
    };
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />

      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
            What's <span className="text-gradient">Your Move?</span>
          </h2>
          <p className="text-muted-foreground text-lg">Choose your activity and book in seconds.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {activities.map((activity, i) => (
            <ActivityCard key={activity.slug} {...activity} delay={i * 0.1} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
