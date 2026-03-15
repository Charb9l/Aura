import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MobileBackButton from "@/components/MobileBackButton";
import { motion } from "framer-motion";

const FEATURES = [
  {
    to: "/book",
    label: "Book Now",
    description: "Reserve your court or class",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="10" width="36" height="32" rx="4" />
        <path d="M6 20h36" />
        <path d="M16 6v8M32 6v8" />
        <circle cx="24" cy="31" r="5" fill="currentColor" fillOpacity="0.15" />
        <path d="M22 31l2 2 4-4" />
      </svg>
    ),
  },
  {
    to: "/clubs",
    label: "Our Clubs",
    description: "Explore partner venues",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 42V18l16-12 16 12v24H8z" />
        <path d="M18 42V30h12v12" />
        <circle cx="24" cy="22" r="4" fill="currentColor" fillOpacity="0.15" />
        <path d="M4 20l20-16 20 16" />
      </svg>
    ),
  },
  {
    to: "/matchmaker",
    label: "AI Matchmaker",
    description: "Find your perfect partner",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="17" cy="16" r="7" />
        <circle cx="31" cy="16" r="7" />
        <path d="M6 40c0-7 5-12 11-12h2" />
        <path d="M42 40c0-7-5-12-11-12h-2" />
        <path d="M20 30l4-3 4 3" fill="currentColor" fillOpacity="0.15" />
        <circle cx="24" cy="36" r="2" fill="currentColor" fillOpacity="0.3" />
      </svg>
    ),
  },
  {
    to: "/habits",
    label: "Habit Tracker",
    description: "AI-powered fitness habits",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 38L14 20l8 12 6-18 8 10h6" />
        <circle cx="14" cy="20" r="2.5" fill="currentColor" fillOpacity="0.2" />
        <circle cx="22" cy="32" r="2.5" fill="currentColor" fillOpacity="0.2" />
        <circle cx="28" cy="14" r="2.5" fill="currentColor" fillOpacity="0.2" />
        <circle cx="36" cy="24" r="2.5" fill="currentColor" fillOpacity="0.2" />
        <path d="M40 10l2-2M42 14h3M40 18l2 2" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    to: "/academy",
    label: "Academies",
    description: "Train with the best coaches",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 6l18 10v4L24 30 6 20v-4L24 6z" fill="currentColor" fillOpacity="0.1" />
        <path d="M24 6l18 10-18 10L6 16 24 6z" />
        <path d="M42 20v12" />
        <path d="M12 24v10c0 2 5 6 12 6s12-4 12-6V24" />
        <circle cx="42" cy="34" r="2" fill="currentColor" fillOpacity="0.3" />
      </svg>
    ),
  },
  {
    to: "/loyalty",
    label: "Loyalty",
    description: "Earn rewards & badges",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="24,4 29,18 44,18 32,27 36,42 24,33 12,42 16,27 4,18 19,18" fill="currentColor" fillOpacity="0.1" />
        <polygon points="24,4 29,18 44,18 32,27 36,42 24,33 12,42 16,27 4,18 19,18" />
        <circle cx="24" cy="24" r="6" fill="currentColor" fillOpacity="0.15" />
      </svg>
    ),
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const Community = () => (
  <div className="min-h-screen pb-24 md:pb-0">
    <Navbar />
    <div className="px-4 pt-4 sm:hidden">
      <MobileBackButton fallbackPath="/" />
    </div>

    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <h1 className="text-2xl font-heading tracking-wide text-foreground mb-1">Community</h1>
      <p className="text-xs text-muted-foreground mb-6 tracking-wider uppercase">Everything in one place</p>

      <motion.div
        className="grid grid-cols-2 gap-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {FEATURES.map((f) => (
          <motion.div key={f.to} variants={item}>
            <Link
              to={f.to}
              className="group relative flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-5 text-center transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)] active:scale-[0.97]"
            >
              {/* Subtle corner accent */}
              <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden rounded-tr-xl">
                <div className="absolute top-0 right-0 w-12 h-[1px] bg-gradient-to-l from-primary/40 to-transparent origin-top-right rotate-0" />
                <div className="absolute top-0 right-0 h-12 w-[1px] bg-gradient-to-b from-primary/40 to-transparent" />
              </div>

              <div className="text-primary transition-transform duration-300 group-hover:scale-110">
                {f.icon}
              </div>
              <span className="text-xs font-medium tracking-wider uppercase text-foreground">{f.label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{f.description}</span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </div>
);

export default Community;
