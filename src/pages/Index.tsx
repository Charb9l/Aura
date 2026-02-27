import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ActivityCard from "@/components/ActivityCard";
import ActivityFilter from "@/components/ActivityFilter";
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
  const [filterSlugs, setFilterSlugs] = useState<string[]>([]);
  const [sectionTitle, setSectionTitle] = useState("What's Your Move?");
  const [sectionSubtitle, setSectionSubtitle] = useState("Choose your activity and book in seconds.");

  useEffect(() => {
    const fetchData = async () => {
      const [offRes, clubRes, contentRes] = await Promise.all([
        supabase.from("offerings").select("*").order("name"),
        supabase.from("clubs").select("*").order("name"),
        supabase.from("page_content").select("content").eq("page_slug", "home").single(),
      ]);
      if (offRes.data) setOfferings(offRes.data as unknown as OfferingData[]);
      if (clubRes.data) setClubs(clubRes.data as unknown as ClubData[]);
      if (contentRes.data) {
        const c = contentRes.data.content as any;
        if (c?.section_title) setSectionTitle(c.section_title);
        if (c?.section_subtitle) setSectionSubtitle(c.section_subtitle);
      }
    };
    fetchData();
  }, []);

  const activities = useMemo(() => {
    return offerings.map((offering) => {
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
  }, [offerings, clubs]);

  const filteredActivities = useMemo(() => {
    if (filterSlugs.length === 0) return activities;
    return activities.filter((a) => filterSlugs.includes(a.slug));
  }, [activities, filterSlugs]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />

      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 flex items-end justify-between gap-4 flex-wrap"
        >
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
              {sectionTitle.includes("Your Move") ? (
                <>What's <span className="text-gradient">Your Move?</span></>
              ) : sectionTitle}
            </h2>
            <p className="text-muted-foreground text-lg">{sectionSubtitle}</p>
          </div>
          <ActivityFilter offerings={offerings} selected={filterSlugs} onChange={setFilterSlugs} />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredActivities.map((activity, i) => (
            <ActivityCard key={activity.slug} {...activity} delay={i * 0.1} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
