import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ActivityCard from "@/components/ActivityCard";
import { motion } from "framer-motion";

import tennisImg from "@/assets/tennis-card.jpg";
import basketballImg from "@/assets/basketball-card.jpg";
import yogaImg from "@/assets/aerial-yoga-card.jpg";
import pilatesImg from "@/assets/pilates-card.jpg";

const activities = [
  {
    title: "Tennis Court",
    description: "Indoor & outdoor courts with premium surfaces. Singles or doubles.",
    image: tennisImg,
    slug: "tennis",
    hasAcademy: true,
  },
  {
    title: "Basketball Court",
    description: "Full-size courts with pro-grade flooring. Open play or team bookings.",
    image: basketballImg,
    slug: "basketball",
    hasAcademy: true,
  },
  {
    title: "Aerial Yoga — Kids",
    description: "Fun, safe aerial sessions designed for children ages 5–12.",
    image: yogaImg,
    slug: "aerial-yoga",
  },
  {
    title: "Reformer Pilates",
    description: "Precision training on state-of-the-art reformer machines.",
    image: pilatesImg,
    slug: "pilates",
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
