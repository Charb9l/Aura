import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerProfileComplete } from "@/hooks/usePlayerProfile";
import { LogOut, User, ShieldCheck, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/matchmaker", label: "AI Matchmaker" },
  { to: "/book", label: "Book Now" },
  { to: "/academy", label: "Academies" },
  { to: "/clubs", label: "Clubs & Partners" },
  { to: "/loyalty", label: "Loyalty" },
];

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isComplete: playerComplete } = usePlayerProfileComplete();
  const showGlow = user && playerComplete === false;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setMobileOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        {/* Left: Logo */}
        <Link to="/" className="font-heading font-bold tracking-tight text-foreground shrink-0">
          <span className="text-xl font-bold">ELEVATE</span>
          <br />
          <span className="text-[10px] font-medium tracking-[0.25em] text-muted-foreground">WELLNESS HUB</span>
        </Link>

        {/* Center: Nav Links (desktop only) */}
        <div className="hidden lg:flex items-center gap-5">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "text-sm font-medium tracking-wide transition-colors whitespace-nowrap",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-underline"
                    className="h-0.5 mt-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: Admin + Auth (desktop only) */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <Link
            to="/admin"
            className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-all flex items-center gap-1.5"
          >
            <ShieldCheck className="h-4 w-4" />
            Admin
          </Link>
          {user ? (
            <>
              <Link
                to="/profile"
                className={cn(
                  "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors relative",
                  showGlow && "text-primary"
                )}
              >
                {showGlow && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary animate-ping" />
                )}
                <User className="h-4 w-4" />
                <span>{user.user_metadata?.full_name || user.email}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-full bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-all flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:glow"
            >
              Login / Sign Up
            </Link>
          )}
        </div>

        {/* Mobile: hamburger + profile icon */}
        <div className="flex lg:hidden items-center gap-2">
          {user && (
            <Link to="/profile" className={cn("text-muted-foreground hover:text-foreground transition-colors p-2 relative", showGlow && "text-primary")}>
              {showGlow && (
                <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-primary animate-ping" />
              )}
              <User className="h-5 w-5" />
            </Link>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors p-2"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden overflow-hidden border-t border-border glass"
          >
            <div className="container mx-auto px-6 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "py-2.5 px-3 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "text-foreground bg-secondary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="border-t border-border my-2" />

              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="py-2.5 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" /> Admin
              </Link>

              {user ? (
                <button
                  onClick={handleSignOut}
                  className="py-2.5 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex items-center gap-2 w-full text-left"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 px-3 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  Login / Sign Up
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
