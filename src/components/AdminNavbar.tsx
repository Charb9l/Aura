import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  LogOut, LayoutDashboard, Users, Settings, Tag, CalendarCheck,
  Building2, GraduationCap, Gamepad2, TrendingUp, PanelLeftClose, PanelLeft, FileBarChart, Package, Menu, X, Bell, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

// Route-to-tab mapping: allows nav_order label overrides from page_content
const ROUTE_TO_TAB: Record<string, string> = {
  "/book": "bookings",
  "/matchmaker": "matchmaker",
  "/academy": "academies",
  "/clubs": "clubs",
  "/loyalty": "loyalty",
  "/habits": "habits",
};

const BASE_MENU_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, tab: "overview" },
  { label: "Activities", icon: Package, tab: "activities" },
  { label: "AI Matchmaker", icon: Gamepad2, tab: "matchmaker" },
  { label: "Bookings", icon: CalendarCheck, tab: "bookings" },
  { label: "Clubs & Partners", icon: Building2, tab: "clubs" },
  { label: "Habit Tracker", icon: TrendingUp, tab: "habits" },
  { label: "Promotions", icon: Tag, tab: "promotions" },
  { label: "Reports", icon: FileBarChart, tab: "reports" },
  { label: "Nudges", icon: Zap, tab: "nudges" },
  { label: "Notifications", icon: Bell, tab: "notifications" },
  { label: "Users", icon: Users, tab: "users" },
  { label: "Settings", icon: Settings, tab: "settings" },
];


interface AdminNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  assignedClubId?: string | null;
  notificationCount?: number;
}

const AdminNavbar = ({ activeTab, onTabChange, assignedClubId, notificationCount = 0 }: AdminNavbarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const assignedAdminTabs = new Set(["overview", "promotions", "bookings"]);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [brandName, setBrandName] = useState({ line1: "ELEVATE", line2: "Wellness Hub" });
  const [allMenuItems, setAllMenuItems] = useState(BASE_MENU_ITEMS);

  useEffect(() => {
    supabase.from("page_content").select("content").eq("page_slug", "home").single().then(({ data }) => {
      if (data) {
        const content = data.content as any;
        if (content?.platform_name_line1) {
          setBrandName({
            line1: content.platform_name_line1 || "ELEVATE",
            line2: content.platform_name_line2 || "",
          });
        } else if (content?.platform_name) {
          const parts = content.platform_name.trim().split(/\s+/);
          setBrandName({ line1: parts[0], line2: parts.slice(1).join(" ") });
        }
        // Override menu labels from nav_order
        if (content?.nav_order?.length) {
          const labelMap: Record<string, string> = {};
          (content.nav_order as { to: string; label: string }[]).forEach(nav => {
            const tab = ROUTE_TO_TAB[nav.to];
            if (tab) labelMap[tab] = nav.label;
          });
          setAllMenuItems(BASE_MENU_ITEMS.map(item =>
            labelMap[item.tab] ? { ...item, label: labelMap[item.tab] } : item
          ));
        }
      }
    });
  }, []);

  // Close mobile menu on tab change
  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    if (isMobile) setMobileOpen(false);
  };

  // Close mobile menu on resize to desktop
  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const isAssignedAdmin = !!assignedClubId;
  const menuItems = isAssignedAdmin
    ? allMenuItems.filter((item) => assignedAdminTabs.has(item.tab))
    : allMenuItems;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const activeLabel = allMenuItems.find(i => i.tab === activeTab)?.label || "Admin";

  const NavItem = ({ item }: { item: typeof allMenuItems[0] }) => {
    const isActive = activeTab === item.tab;
    const showLabel = isMobile || !collapsed;
    const content = (
      <button
        onClick={() => handleTabChange(item.tab)}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
          !isMobile && collapsed && "justify-center px-2",
          isActive
            ? "bg-primary/8 text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}
        <item.icon className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )} />
        <AnimatePresence mode="wait">
          {showLabel && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {item.tab === "notifications" && notificationCount > 0 && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5">
            {notificationCount > 99 ? "99+" : notificationCount}
          </span>
        )}
      </button>
    );

    if (!isMobile && collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }
    return content;
  };

  // ─── Mobile: top bar + overlay drawer ───────────────────────
  if (isMobile) {
    return (
      <>
        {/* Fixed top bar */}
        <div className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 border-b border-border/60 bg-background pt-[env(safe-area-inset-top)]">
          <button onClick={() => setMobileOpen(true)} className="flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-heading font-bold text-sm text-foreground">{activeLabel}</span>
          <div className="w-9" /> {/* spacer for centering */}
        </div>

        {/* Overlay backdrop + drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-0 left-0 bottom-0 z-50 w-[280px] flex flex-col border-r border-border/60 bg-background"
              >
                {/* Header */}
                <div className="flex items-center justify-between h-14 px-5 border-b border-border/60 shrink-0">
                  <button onClick={() => handleTabChange("overview")} className="font-heading font-bold tracking-tight text-foreground cursor-pointer">
                    <div className="flex flex-col leading-tight">
                     <span className="text-base font-bold tracking-wide">{brandName.line1}</span>
                      {brandName.line2 && <span className="text-[8px] font-medium tracking-[0.25em] text-muted-foreground uppercase">{brandName.line2}</span>}
                    </div>
                  </button>
                  <button onClick={() => setMobileOpen(false)} className="flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
                  {menuItems.map((item) => <NavItem key={item.tab} item={item} />)}
                </nav>

                {/* Footer */}
                <div className="shrink-0 border-t border-border/60">
                  {user && (
                    <div className="px-5 pt-3 pb-1">
                      <p className="text-[11px] text-muted-foreground truncate font-medium">
                        {user.user_metadata?.full_name || user.email}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-1 px-3 py-3">
                    <button onClick={handleSignOut} className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                      <LogOut className="h-[18px] w-[18px]" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ─── Desktop: fixed sidebar ─────────────────────────────────
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 h-screen z-50 flex flex-col border-r border-border/60 bg-background"
    >
      {/* Header */}
      <div className={cn(
        "flex items-center h-16 border-b border-border/60 shrink-0",
        collapsed ? "justify-center px-2" : "px-5"
      )}>
        <button onClick={() => handleTabChange("overview")} className="font-heading font-bold tracking-tight text-foreground cursor-pointer">
          {collapsed ? (
            <span className="text-base font-bold">{brandName.line1.charAt(0)}</span>
          ) : (
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-wide">{brandName.line1}</span>
              {brandName.line2 && <span className="text-[8px] font-medium tracking-[0.25em] text-muted-foreground uppercase">{brandName.line2}</span>}
            </div>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {menuItems.map((item) => <NavItem key={item.tab} item={item} />)}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border/60">
        {user && !collapsed && (
          <div className="px-5 pt-3 pb-1">
            <p className="text-[11px] text-muted-foreground truncate font-medium">
              {user.user_metadata?.full_name || user.email}
            </p>
          </div>
        )}
        <div className={cn("flex items-center gap-1 px-3 py-3", collapsed && "flex-col")}>
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button onClick={handleSignOut} className="flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <LogOut className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Sign Out</TooltipContent>
            </Tooltip>
          ) : (
            <button onClick={handleSignOut} className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <LogOut className="h-[18px] w-[18px]" />
              <span>Sign Out</span>
            </button>
          )}
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button onClick={() => setCollapsed(false)} className="flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <PanelLeft className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Expand</TooltipContent>
            </Tooltip>
          ) : (
            <button onClick={() => setCollapsed(true)} className="ml-auto flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <PanelLeftClose className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default AdminNavbar;
