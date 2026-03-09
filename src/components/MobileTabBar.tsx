import { Link, useLocation } from "react-router-dom";
import { Home, CalendarCheck, Users, User, Trophy, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMediaQuery } from "@/hooks/use-mobile";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/book", label: "Book", icon: CalendarCheck },
  { to: "/matchmaker", label: "Match", icon: Users },
  { to: "/loyalty", label: "Loyalty", icon: Trophy },
];

const MobileTabBar = () => {
  const location = useLocation();
  const { user } = useAuth();
  // Only show on small phones (< 640px), not tablets
  const isSmallMobile = useMediaQuery("(max-width: 639px)");

  // Only show on small mobile phones, and not on admin pages
  if (!isSmallMobile || location.pathname.startsWith("/admin")) return null;

  const profileTab = user
    ? { to: "/profile", label: "Profile", icon: User }
    : { to: "/auth", label: "Login", icon: LogIn };

  const allTabs = [...TABS, profileTab];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {allTabs.map((tab) => {
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
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;
