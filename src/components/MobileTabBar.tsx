import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { ProfileIcon } from "@/components/icons/BrandIcons";


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

const IconProfile = ({ className }: { className?: string }) => (
  <ProfileIcon className={className} />
);

const IconClubs = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21V7l9-4 9 4v14" />
    <path d="M9 21V13h6v8" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const TABS = [
  { to: "/", label: "Home", Icon: IconHome },
  { to: "/book", label: "Book", Icon: IconBook },
  { to: "/community", label: "Your Space", Icon: IconCommunity },
  { to: "/clubs", label: "Clubs", Icon: IconClubs },
  { to: "/profile", label: "Profile", Icon: IconProfile },
];

const MobileTabBar = () => {
  const location = useLocation();
  const isSmallMobile = useMediaQuery("(max-width: 639px)");
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();

  if (!isSmallMobile || location.pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 rounded-2xl bg-white/[0.05] backdrop-blur-2xl pb-[env(safe-area-inset-bottom)] shadow-[0_0_40px_rgba(124,58,237,0.08),0_-4px_20px_rgba(0,0,0,0.3)]"
      style={{ border: 'none' }}
    >
      <div className="flex items-center justify-around h-16">
        {TABS.map((tab) => {
          const isActive = tab.to === "/"
            ? location.pathname === "/"
            : tab.to === "/clubs"
              ? location.pathname === "/clubs" || location.pathname === "/academy"
              : location.pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-300 relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-glow"
                  className="absolute inset-0 rounded-xl bg-primary/[0.08]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.Icon className={cn("h-5 w-5 relative z-10", isActive && "drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]")} />
              <span className={cn("text-[10px] font-semibold relative z-10", isActive && "text-primary")}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;
