import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MobileBackButton from "@/components/MobileBackButton";
import { motion } from "framer-motion";
import { MatchmakerIcon } from "@/components/icons/BrandIcons";

const FEATURES = [
  {
    to: "/loyalty",
    label: "Loyalty",
    description: "Earn rewards & badges",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="24,4 29,18 44,18 32,27 36,42 24,33 12,42 16,27 4,18 19,18" fill="currentColor" fillOpacity="0.08" />
        <polygon points="24,4 29,18 44,18 32,27 36,42 24,33 12,42 16,27 4,18 19,18" />
        <circle cx="24" cy="24" r="5" fill="currentColor" fillOpacity="0.12" />
      </svg>
    ),
  },
  {
    to: "/matchmaker",
    label: "Matchmaker",
    description: "Find your perfect partner",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="17" cy="16" r="7" />
        <circle cx="31" cy="16" r="7" />
        <path d="M6 40c0-7 5-12 11-12h2" />
        <path d="M42 40c0-7-5-12-11-12h-2" />
        <path d="M20 30l4-3 4 3" fill="currentColor" fillOpacity="0.12" />
        <circle cx="24" cy="36" r="2" fill="currentColor" fillOpacity="0.2" />
      </svg>
    ),
  },
  {
    to: "/habits",
    label: "Habit Tracker",
    description: "Track your fitness habits",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 38L14 20l8 12 6-18 8 10h6" />
        <circle cx="14" cy="20" r="2.5" fill="currentColor" fillOpacity="0.15" />
        <circle cx="22" cy="32" r="2.5" fill="currentColor" fillOpacity="0.15" />
        <circle cx="28" cy="14" r="2.5" fill="currentColor" fillOpacity="0.15" />
        <circle cx="36" cy="24" r="2.5" fill="currentColor" fillOpacity="0.15" />
      </svg>
    ),
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
