import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MobileBackButton from "@/components/MobileBackButton";
import { motion } from "framer-motion";
import { MatchmakerIcon, HabitTrackerIcon, LoyaltyIcon } from "@/components/icons/BrandIcons";

const FEATURES = [
  {
    to: "/loyalty",
    label: "Loyalty",
    description: "Earn rewards & badges",
    icon: <LoyaltyIcon className="w-7 h-7" />,
  },
  {
    to: "/matchmaker",
    label: "Matchmaker",
    description: "Find your perfect partner",
    icon: <MatchmakerIcon className="w-7 h-7" />,
  },
  {
    to: "/habits",
    label: "Habit Tracker",
    description: "Track your fitness habits",
    icon: <HabitTrackerIcon className="w-7 h-7" />,
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const Community = () => {
  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <Navbar />
      <div className="px-4 pt-4 sm:hidden">
        <MobileBackButton fallbackPath="/" />
      </div>

      <div className="max-w-lg mx-auto px-4 pt-20 sm:pt-24 pb-8">
        <h1 className="text-2xl font-heading tracking-wide text-foreground mb-1">Your Space</h1>
        <p className="text-xs text-muted-foreground mb-6 tracking-wider uppercase">Everything in one place</p>

        <motion.div
          className="flex flex-col gap-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {FEATURES.map((f) => (
            <motion.div key={f.to} variants={item}>
              <Link
                to={f.to}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary shrink-0 transition-transform duration-300 group-hover:scale-110">
                  {f.icon}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold tracking-wide text-foreground">{f.label}</span>
                  <span className="text-xs text-muted-foreground">{f.description}</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-muted-foreground/50 ml-auto shrink-0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Community;
