import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerProfileComplete } from "@/hooks/usePlayerProfile";
import { useAvatar, getInitials } from "@/hooks/useAvatar";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useBadgeLevels } from "@/hooks/useBadgeLevels";
import { useBadgePoints } from "@/hooks/useBadgePoints";
import { usePendingNudgeCount } from "@/hooks/useNudges";
import { LogOut, ShieldCheck, Menu, X, LogIn } from "lucide-react";
import { useCustomerNotificationCount } from "@/hooks/useCustomerNotifications";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useRewards } from "@/hooks/useRewards";

const DEFAULT_NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/habits", label: "Habit Tracker" },
  { to: "/matchmaker", label: "Matchmaker" },
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (loggedOutDropdownRef.current && !loggedOutDropdownRef.current.contains(e.target as Node)) setLoggedOutDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { isComplete: playerComplete } = usePlayerProfileComplete();
  const { avatarUrl } = useAvatar();
  const [hasPendingBookings, setHasPendingBookings] = useState(false);
  const [navBookings, setNavBookings] = useState<any[]>([]);
  const { completedLevelCount } = useBadgeLevels(navBookings);
  const { assignedLevels, loading: badgeLoading } = useBadgePoints();
  const hasUnassignedBadgePoints = !badgeLoading && completedLevelCount > assignedLevels.size;
  const pendingNudgeCount = usePendingNudgeCount();
  const customerNotifCount = useCustomerNotificationCount();
  const showGlow = user && (playerComplete === false || !avatarUrl || customerNotifCount > 0 || hasPendingBookings || pendingNudgeCount > 0);
  const { isAdmin } = useAdminRole();
  const { hasRewards } = useRewards();
  const initials = getInitials(user?.user_metadata?.full_name, user?.email);

  const [glowRoutes, setGlowRoutes] = useState<Set<string>>(new Set());
  const [NAV_LINKS, setNavLinks] = useState(DEFAULT_NAV_LINKS);
  const [platformName, setPlatformName] = useState({ line1: "ELEVATE", line2: "Wellness Hub" });
  useEffect(() => {
    supabase.from("page_content").select("content").eq("page_slug", "home").single().then(({ data }) => {
      if (data) {
        const content = data.content as any;
        const navGlowRoutes = new Set<string>();
        if (content?.nav_order?.length) {
          (content.nav_order as any[]).forEach((n: any) => { if (n.glow) navGlowRoutes.add(n.to); });
        }
        if (navGlowRoutes.size === 0) {
          (content?.hero_buttons || []).filter((b: any) => b.glow).forEach((b: any) => navGlowRoutes.add(b.to));
        }
        setGlowRoutes(navGlowRoutes);
        if (content?.nav_order?.length) setNavLinks(content.nav_order);
        if (content?.platform_name_line1) {
          setPlatformName({ line1: content.platform_name_line1, line2: content.platform_name_line2 || "" });
        } else if (content?.platform_name) {
          const parts = content.platform_name.trim().split(/\s+/);
          if (parts.length >= 2) {
            setPlatformName({ line1: parts[0], line2: parts.slice(1).join(" ") });
          } else {
            setPlatformName({ line1: parts[0], line2: "" });
          }
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!user) { setHasPendingBookings(false); setNavBookings([]); return; }
    const today = new Date().toISOString().split("T")[0];
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "confirmed").gte("booking_date", today).is("attendance_status", null).then(({ count }) => setHasPendingBookings((count ?? 0) > 0));
    supabase.from("bookings").select("id, activity, activity_name, booking_date, booking_time, attendance_status, status").eq("user_id", user.id).then(({ data }) => setNavBookings(data || []));
  }, [user]);

  const handleSignOut = async () => { await signOut(); navigate("/"); setMobileOpen(false); };

  const AvatarDisplay = ({ size = "sm" }: { size?: "sm" | "md" }) => {
    const sizeClass = size === "md" ? "h-8 w-8 text-[9px]" : "h-7 w-7 text-[9px]";
    return avatarUrl ? (
      <img src={avatarUrl} alt="Avatar" className={cn(sizeClass, "rounded-full object-cover border-2 border-primary/20")} />
    ) : (
      <div className={cn(sizeClass, "rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center border-2 border-primary/20")}>{initials}</div>
    );
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass pt-[env(safe-area-inset-top)]"
    >
      <div className="container mx-auto flex items-center justify-between sm:justify-between justify-center px-4 sm:px-8 py-5 sm:py-4 relative">
        {/* Logo */}
        <Link to="/" className="font-heading tracking-tight text-foreground shrink-0 sm:static absolute left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto text-center sm:text-left leading-none">
          <span className="text-3xl sm:text-2xl font-bold mobile-logo-glow">{platformName.line1}</span>
          {platformName.line2 && (
            <>
              <br />
              <span className="text-[8px] sm:text-[9px] font-body font-medium tracking-[0.25em] text-muted-foreground uppercase block mt-0.5">{platformName.line2}</span>
            </>
          )}
        </Link>

        {/* Center: Nav Links (desktop) */}
        <div className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.to;
            const isGold = glowRoutes.has(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "text-xs font-medium tracking-wide transition-colors whitespace-nowrap relative",
                  isGold && "text-accent",
                  !isGold && isActive && "text-foreground",
                  !isGold && !isActive && "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
                {link.to === "/book" && hasRewards && user && (
                  <span className="absolute -top-1 -right-2.5 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                )}
                {link.to === "/book" && hasRewards && user && (
                  <span className="absolute -top-1 -right-2.5 h-2 w-2 rounded-full bg-emerald-400" />
                )}
                {isActive && (
                  <motion.div
                    layoutId="nav-underline"
                    className="h-[2px] mt-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: Auth (desktop) */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(prev => !prev)} className={cn("flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors relative", showGlow && "text-primary")}>
                {showGlow && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-accent animate-ping" />}
                {showGlow && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-accent" />}
                <AvatarDisplay />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }} className="absolute right-0 mt-3 w-48 glass-card rounded-xl overflow-hidden">
                    <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                      <AvatarDisplay /> Profile
                    </Link>
                    <button onClick={() => { setDropdownOpen(false); handleSignOut(); }} className="w-full flex items-center gap-2 px-5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                    {isAdmin && (
                      <>
                        <div className="border-t border-border" />
                        <Link to="/admin-login" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
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
              <button onClick={() => setLoggedOutDropdownOpen(prev => !prev)} className="rounded-full bg-primary text-primary-foreground p-2.5 transition-all hover:bg-primary/90 shadow-sm">
                <LogIn className="h-4 w-4" />
              </button>
              <AnimatePresence>
                {loggedOutDropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }} className="absolute right-0 mt-3 w-48 glass-card rounded-xl overflow-hidden">
                    <Link to="/auth" onClick={() => setLoggedOutDropdownOpen(false)} className="flex items-center gap-2 px-5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">Login / Sign Up</Link>
                    <div className="border-t border-border" />
                    <Link to="/admin-login" onClick={() => setLoggedOutDropdownOpen(false)} className="flex items-center gap-2 px-5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                      <ShieldCheck className="h-4 w-4" /> Admin
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Mobile/Tablet: hamburger only (profile moved to bottom tab bar on small mobile) */}
        <div className="flex lg:hidden items-center gap-1">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="hidden sm:flex p-2.5 text-muted-foreground active:text-foreground transition-colors min-h-[44px] min-w-[44px] items-center justify-center">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="lg:hidden overflow-hidden border-t border-border bg-card">
            <div className="container mx-auto px-6 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.to;
                const isGold = glowRoutes.has(link.to);
                return (
                  <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className={cn(
                    "py-3 px-4 text-sm font-medium rounded-xl transition-colors relative",
                    isGold && "text-accent",
                    isActive && !isGold && "text-foreground bg-muted/50",
                    !isActive && !isGold && "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}>
                    {link.label}
                    {link.to === "/book" && hasRewards && user && (
                      <span className="inline-block ml-1.5 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </Link>
                );
              })}
              {isAdmin && (
                <>
                  <div className="border-t border-border my-2" />
                  <Link to="/admin-login" onClick={() => setMobileOpen(false)} className="py-3 px-4 text-sm font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Admin
                  </Link>
                </>
              )}
              {user ? (
                <button onClick={handleSignOut} className="py-3 px-4 text-sm font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors flex items-center gap-2 w-full text-left">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setMobileOpen(false)} className="py-3 px-4 text-sm font-medium rounded-xl text-primary hover:bg-primary/5 transition-colors flex items-center gap-2">
                    <LogIn className="h-4 w-4" /> Login / Sign Up
                  </Link>
                  <div className="border-t border-border my-2" />
                  <Link to="/admin-login" onClick={() => setMobileOpen(false)} className="py-3 px-4 text-sm font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors flex items-center gap-2">
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
