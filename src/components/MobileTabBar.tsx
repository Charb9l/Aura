import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";

const IconHome = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5L12 3l9 7.5" />
    <path d="M5 10v9a1 1 0 001 1h3v-5a1 1 0 011-1h4a1 1 0 011 1v5h3a1 1 0 001-1v-9" />
  </svg>
);

const IconBook = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="3" />
    <path d="M3 10h18" />
    <path d="M8 2v4M16 2v4" />
    <path d="M9 15l2 2 4-4" />
  </svg>
);

const IconCommunity = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="8" height="8" rx="2" />
    <rect x="13" y="3" width="8" height="8" rx="2" />
    <rect x="3" y="13" width="8" height="8" rx="2" />
    <rect x="13" y="13" width="8" height="8" rx="2" />
  </svg>
);

const IconMatchmaker = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="4" />
    <circle cx="15" cy="8" r="4" />
    <path d="M4 21c0-4 2.5-7 5.5-7" />
    <path d="M20 21c0-4-2.5-7-5.5-7" />
    <path d="M10.5 16l1.5-1.5L13.5 16" />
  </svg>
);

const IconHabits = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 18l4-8 4 6 3-10 4 5h3" />
    <circle cx="8" cy="10" r="1.5" fill="currentColor" fillOpacity="0.3" />
    <circle cx="12" cy="16" r="1.5" fill="currentColor" fillOpacity="0.3" />
    <circle cx="15" cy="6" r="1.5" fill="currentColor" fillOpacity="0.3" />
  </svg>
);

const TABS = [
  { to: "/", label: "Home", Icon: IconHome },
  { to: "/book", label: "Book", Icon: IconBook },
  { to: "/community", label: "Community", Icon: IconCommunity },
  { to: "/matchmaker", label: "Match", Icon: IconMatchmaker },
  { to: "/habits", label: "Habits", Icon: IconHabits },
];

const MobileTabBar = () => {
  const location = useLocation();
  const isSmallMobile = useMediaQuery("(max-width: 639px)");
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();

  if (!isSmallMobile || location.pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_-4px_hsl(220_25%_12%/0.06)]">
      <div className="flex items-center justify-around h-16">
        {TABS.map((tab) => {
          const isActive = tab.to === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;
