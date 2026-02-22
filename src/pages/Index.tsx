import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ActivityCard from "@/components/ActivityCard";
import { motion } from "framer-motion";

import tennisCourtImg from "@/assets/tennis-court.png";
import basketballCourtImg from "@/assets/basketball-court.png";
import yogaImg from "@/assets/aerial-yoga-studio.png";
import pilatesImg from "@/assets/pilates-studio.png";

import hardcourtLogo from "@/assets/hardcourt-logo.png";
import beirutLogo from "@/assets/beirut-logo.png";
import enformeLogo from "@/assets/enforme-logo.png";

const activities = [
  {
    title: "Tennis Court",
    subtitle: "Hard Court",
    description: "Blue hard courts with premium surfaces. Singles or doubles.",
    image: tennisCourtImg,
    logo: hardcourtLogo,
    slug: "tennis",
    hasAcademy: true,
    brandColor: "tennis" as const,
  },
  {
    title: "Basketball Court",
    subtitle: "Beirut Sports Club",
    description: "Full-size courts with pro-grade flooring. Open play or team bookings.",
    image: basketballCourtImg,
    logo: beirutLogo,
    slug: "basketball",
    hasAcademy: true,
    brandColor: "basketball" as const,
  },
  {
    title: "Aerial Yoga — Kids",
    subtitle: "En Forme",
    description: "Fun, safe aerial sessions designed for children ages 5–12.",
    image: yogaImg,
    logo: enformeLogo,
    slug: "aerial-yoga",
    brandColor: "wellness" as const,
  },
  {
    title: "Reformer Pilates",
    subtitle: "En Forme",
    description: "Precision training on state-of-the-art reformer machines.",
    image: pilatesImg,
    logo: enformeLogo,
    slug: "pilates",
    brandColor: "wellness" as const,
  },
];

const Index = () => {
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

      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Courtside. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
