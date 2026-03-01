import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerProfileComplete } from "@/hooks/usePlayerProfile";
import { useAvatar, getInitials } from "@/hooks/useAvatar";
import { useAdminRole } from "@/hooks/useAdminRole";
import { LogOut, ShieldCheck, Menu, X, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/habits", label: "AI Habit Tracker" },
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggedOutDropdownOpen, setLoggedOutDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const loggedOutDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (loggedOutDropdownRef.current && !loggedOutDropdownRef.current.contains(e.target as Node)) {
        setLoggedOutDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const { isComplete: playerComplete } = usePlayerProfileComplete();
  const { avatarUrl } = useAvatar();
  const showGlow = user && playerComplete === false;
  const { isAdmin } = useAdminRole();

  const initials = getInitials(user?.user_metadata?.full_name, user?.email);

  // Fetch glow routes and nav order from CMS
  const [glowRoutes, setGlowRoutes] = useState<Set<string>>(new Set());
  const [NAV_LINKS, setNavLinks] = useState(DEFAULT_NAV_LINKS);
  useEffect(() => {
    supabase.from("page_content").select("content").eq("page_slug", "home").single().then(({ data }) => {
      if (data) {
        const content = data.content as any;
        const routes = new Set<string>(
          (content?.hero_buttons || []).filter((b: any) => b.glow).map((b: any) => b.to)
        );
        setGlowRoutes(routes);
        if (content?.nav_order?.length) {
          setNavLinks(content.nav_order);
        }
      }
    });
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setMobileOpen(false);
  };

  const AvatarDisplay = ({ size = "sm" }: { size?: "sm" | "md" }) => {
    const sizeClass = size === "md" ? "h-8 w-8 text-xs" : "h-7 w-7 text-[10px]";
    return avatarUrl ? (
      <img src={avatarUrl} alt="Avatar" className={cn(sizeClass, "rounded-full object-cover border border-border")} />
    ) : (
      <div className={cn(sizeClass, "rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center border border-border")}>
        {initials}
      </div>
    );
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
            const isGold = glowRoutes.has(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "text-sm font-medium tracking-wide transition-colors whitespace-nowrap",
                  isGold && !isActive && "text-amber-300 drop-shadow-[0_0_6px_hsl(43_96%_56%/0.5)]",
                  isGold && isActive && "text-amber-300 drop-shadow-[0_0_6px_hsl(43_96%_56%/0.5)]",
                  !isGold && isActive && "text-foreground",
                  !isGold && !isActive && "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-underline"
                    className={cn("h-0.5 mt-0.5 rounded-full", isGold ? "bg-amber-400" : "bg-primary")}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: Auth dropdown (desktop only) */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className={cn(
                  "flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors relative",
                  showGlow && "text-primary"
                )}
              >
                {showGlow && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary animate-ping" />
                )}
                <AvatarDisplay />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-44 rounded-xl border border-border bg-card shadow-lg overflow-hidden"
                  >
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                    >
                      <AvatarDisplay /> Profile
                    </Link>
                    <button
                      onClick={() => { setDropdownOpen(false); handleSignOut(); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                    {isAdmin && (
                      <>
                        <div className="border-t-2 border-border" />
                        <Link
                          to="/admin-login"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                        >
                          <ShieldCheck className="h-4 w-4" /> Admin
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="relative" ref={loggedOutDropdownRef}>
              <button
                onClick={() => setLoggedOutDropdownOpen(prev => !prev)}
                className="rounded-full bg-primary p-2.5 text-primary-foreground transition-all hover:glow"
              >
                <LogIn className="h-5 w-5" />
              </button>
              <AnimatePresence>
                {loggedOutDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-44 rounded-xl border border-border bg-card shadow-lg overflow-hidden"
                  >
                    <Link
                      to="/auth"
                      onClick={() => setLoggedOutDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                    >
                      Login / Sign Up
                    </Link>
                    <div className="border-t-2 border-border" />
                    <Link
                      to="/admin-login"
                      onClick={() => setLoggedOutDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                    >
                      <ShieldCheck className="h-4 w-4" /> Admin
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Mobile: hamburger + profile icon */}
        <div className="flex lg:hidden items-center gap-2">
          {user && (
            <Link to="/profile" className={cn("text-muted-foreground hover:text-foreground transition-colors p-1 relative", showGlow && "text-primary")}>
              {showGlow && (
                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-primary animate-ping" />
              )}
              <AvatarDisplay size="md" />
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
                const isGold = glowRoutes.has(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "py-2.5 px-3 rounded-lg text-sm font-medium transition-colors",
                      isGold && "text-amber-300 drop-shadow-[0_0_6px_hsl(43_96%_56%/0.5)]",
                      isActive && !isGold && "text-foreground bg-secondary",
                      isActive && isGold && "bg-amber-400/10",
                      !isActive && !isGold && "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {isAdmin && (
                <>
                  <div className="border-t border-border my-2" />
                  <Link
                     to="/admin-login"
                    onClick={() => setMobileOpen(false)}
                    className="py-2.5 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex items-center gap-2"
                  >
                    <ShieldCheck className="h-4 w-4" /> Admin
                  </Link>
                </>
              )}

              {user ? (
                <button
                  onClick={handleSignOut}
                  className="py-2.5 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex items-center gap-2 w-full text-left"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              ) : (
                <>
                  <Link
                    to="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="py-2.5 px-3 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4" /> Login / Sign Up
                  </Link>
                  <div className="border-t-2 border-border my-2" />
                  <Link
                    to="/admin-login"
                    onClick={() => setMobileOpen(false)}
                    className="py-2.5 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex items-center gap-2"
                  >
                    <ShieldCheck className="h-4 w-4" /> Admin
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
