import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerProfileComplete } from "@/hooks/usePlayerProfile";
import { useAvatar, getInitials } from "@/hooks/useAvatar";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useBadgeLevels } from "@/hooks/useBadgeLevels";
import { useBadgePoints } from "@/hooks/useBadgePoints";
import { usePendingNudgeCount } from "@/hooks/useNudges";
import { LogOut, ShieldCheck, Menu, X, LogIn, Bell } from "lucide-react";
import { useCustomerNotificationCount } from "@/hooks/useCustomerNotifications";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useRewards } from "@/hooks/useRewards";

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
        const routes = new Set<string>((content?.hero_buttons || []).filter((b: any) => b.glow).map((b: any) => b.to));
        setGlowRoutes(routes);
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
      <img src={avatarUrl} alt="Avatar" className={cn(sizeClass, "rounded-full object-cover border border-border")} />
    ) : (
      <div className={cn(sizeClass, "rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center border border-border")}>{initials}</div>
    );
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass pt-[env(safe-area-inset-top)]"
    >
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-8 py-3 sm:py-5">
        {/* Logo */}
        <Link to="/" className="font-heading tracking-tight text-foreground shrink-0">
          <span className="text-2xl font-light">{platformName.line1}</span>
          {platformName.line2 && (
            <>
              <br />
              <span className="text-[9px] font-body font-light tracking-[0.35em] text-muted-foreground uppercase">{platformName.line2}</span>
            </>
          )}
        </Link>

        {/* Center: Nav Links (desktop) */}
        <div className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.to;
            const isGold = glowRoutes.has(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "text-xs font-light tracking-[0.1em] uppercase transition-colors whitespace-nowrap relative",
                  isGold && "text-primary",
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
                    className="h-[1px] mt-1.5 bg-primary"
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
                {showGlow && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-ping" />}
                <AvatarDisplay />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }} className="absolute right-0 mt-3 w-44 glass-card rounded-sm overflow-hidden">
                    <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-5 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                      <AvatarDisplay /> Profile
                    </Link>
                    <button onClick={() => { setDropdownOpen(false); handleSignOut(); }} className="w-full flex items-center gap-2 px-5 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                      <LogOut className="h-3.5 w-3.5" /> Sign Out
                    </button>
                    {isAdmin && (
                      <>
                        <div className="border-t border-border" />
                        <Link to="/admin-login" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-5 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                          <ShieldCheck className="h-3.5 w-3.5" /> Admin
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="relative" ref={loggedOutDropdownRef}>
              <button onClick={() => setLoggedOutDropdownOpen(prev => !prev)} className="rounded-full border border-primary/30 p-2 text-primary transition-all hover:bg-primary/5">
                <LogIn className="h-4 w-4" />
              </button>
              <AnimatePresence>
                {loggedOutDropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }} className="absolute right-0 mt-3 w-44 glass-card rounded-sm overflow-hidden">
                    <Link to="/auth" onClick={() => setLoggedOutDropdownOpen(false)} className="flex items-center gap-2 px-5 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">Login / Sign Up</Link>
                    <div className="border-t border-border" />
                    <Link to="/admin-login" onClick={() => setLoggedOutDropdownOpen(false)} className="flex items-center gap-2 px-5 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                      <ShieldCheck className="h-3.5 w-3.5" /> Admin
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Mobile/Tablet: hamburger + profile */}
        <div className="flex lg:hidden items-center gap-1">
          {user && (
            <Link to="/profile" className={cn("text-muted-foreground active:text-foreground transition-colors p-2 relative min-h-[44px] min-w-[44px] flex items-center justify-center", showGlow && "text-primary")}>
              {showGlow && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-ping" />}
              <AvatarDisplay size="md" />
            </Link>
          )}
          {!user && (
            <Link to="/auth" className="rounded-full border border-primary/30 p-2.5 text-primary transition-all active:bg-primary/5 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <LogIn className="h-5 w-5" />
            </Link>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2.5 text-muted-foreground active:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="lg:hidden overflow-hidden border-t border-border glass">
            <div className="container mx-auto px-8 py-6 flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.to;
                const isGold = glowRoutes.has(link.to);
                return (
                  <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className={cn(
                    "py-3 px-3 text-xs font-light uppercase tracking-[0.1em] transition-colors relative",
                    isGold && "text-primary",
                    isActive && !isGold && "text-foreground",
                    !isActive && !isGold && "text-muted-foreground hover:text-foreground"
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
                  <div className="border-t border-border my-3" />
                  <Link to="/admin-login" onClick={() => setMobileOpen(false)} className="py-3 px-3 text-xs font-light uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" /> Admin
                  </Link>
                </>
              )}
              {user ? (
                <button onClick={handleSignOut} className="py-3 px-3 text-xs font-light uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-full text-left">
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setMobileOpen(false)} className="py-3 px-3 text-xs font-light uppercase tracking-[0.1em] text-primary hover:text-foreground transition-colors flex items-center gap-2">
                    <LogIn className="h-3.5 w-3.5" /> Login / Sign Up
                  </Link>
                  <div className="border-t border-border my-3" />
                  <Link to="/admin-login" onClick={() => setMobileOpen(false)} className="py-3 px-3 text-xs font-light uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" /> Admin
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
