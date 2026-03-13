import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, CalendarCheck, Building2, GraduationCap, Menu, X, LogOut, LogIn, ShieldCheck, TrendingUp, Users, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/book", label: "Book", icon: CalendarCheck },
  { to: "/clubs", label: "Clubs", icon: Building2 },
  { to: "/academy", label: "Academies", icon: GraduationCap },
];

const MORE_LINKS = [
  { to: "/habits", label: "AI Habit Tracker", icon: TrendingUp },
  { to: "/matchmaker", label: "AI Matchmaker", icon: Users },
  { to: "/loyalty", label: "Loyalty", icon: Trophy },
];

const MobileTabBar = () => {
  const location = useLocation();
  const isSmallMobile = useMediaQuery("(max-width: 639px)");
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();

  if (!isSmallMobile || location.pathname.startsWith("/admin")) return null;

  const isMenuActive = MORE_LINKS.some((l) => location.pathname.startsWith(l.to));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
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
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}

        {/* Hamburger menu */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative",
                isMenuActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isMenuActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
            <div className="flex flex-col gap-1 py-4">
              {MORE_LINKS.map((link) => {
                const isActive = location.pathname.startsWith(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 py-3 px-4 rounded-lg text-sm font-light uppercase tracking-[0.1em] transition-colors",
                      isActive ? "text-foreground bg-muted/40" : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}

              <div className="border-t border-border my-2" />

              {isAdmin && (
                <Link
                  to="/admin-login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 py-3 px-4 rounded-lg text-sm font-light uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </Link>
              )}

              {user ? (
                <button
                  onClick={async () => { await signOut(); setMenuOpen(false); }}
                  className="flex items-center gap-3 py-3 px-4 rounded-lg text-sm font-light uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              ) : (
                <>
                  <Link
                    to="/auth"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-4 rounded-lg text-sm font-light uppercase tracking-[0.1em] text-primary hover:text-foreground hover:bg-muted/20 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    Login / Sign Up
                  </Link>
                  <Link
                    to="/admin-login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-4 rounded-lg text-sm font-light uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default MobileTabBar;
