import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  LogOut, LayoutDashboard, Users, Settings, Tag, CalendarCheck, Eye,
  Building2, GraduationCap, Gamepad2, TrendingUp, PanelLeftClose, PanelLeft, FileBarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const allMenuItems = [
  { label: "Dashboard", icon: LayoutDashboard, tab: "overview" },
  { label: "Bookings", icon: CalendarCheck, tab: "bookings" },
  { label: "Users", icon: Users, tab: "users" },
  { label: "Clubs & Partners", icon: Building2, tab: "clubs" },
  { label: "Academies", icon: GraduationCap, tab: "academies" },
  { label: "Promotions", icon: Tag, tab: "promotions" },
  { label: "Customer Vision", icon: Eye, tab: "customer-vision" },
  { label: "MyPlayer", icon: Gamepad2, tab: "myplayer" },
  { label: "Habit Tracker", icon: TrendingUp, tab: "habits" },
  { label: "Reports", icon: FileBarChart, tab: "reports" },
  { label: "Settings", icon: Settings, tab: "settings" },
];

const assignedAdminTabs = new Set(["overview", "promotions", "bookings"]);

interface AdminNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  assignedClubId?: string | null;
}

const AdminNavbar = ({ activeTab, onTabChange, assignedClubId }: AdminNavbarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isAssignedAdmin = !!assignedClubId;
  const menuItems = isAssignedAdmin
    ? allMenuItems.filter((item) => assignedAdminTabs.has(item.tab))
    : allMenuItems;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const sidebarWidth = collapsed ? "w-[68px]" : "w-60";

  const NavItem = ({ item }: { item: typeof allMenuItems[0] }) => {
    const isActive = activeTab === item.tab;
    const content = (
      <button
        onClick={() => onTabChange(item.tab)}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
          collapsed && "justify-center px-2",
          isActive
            ? "bg-primary/8 text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        {/* Active indicator bar */}
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
          {!collapsed && (
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
      </button>
    );

    if (collapsed) {
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

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed top-0 left-0 h-screen z-50 flex flex-col border-r border-border/60 bg-background"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center h-16 border-b border-border/60 shrink-0",
        collapsed ? "justify-center px-2" : "px-5"
      )}>
        <button
          onClick={() => onTabChange("overview")}
          className="font-heading font-bold tracking-tight text-foreground cursor-pointer"
        >
          {collapsed ? (
            <span className="text-base font-bold">E</span>
          ) : (
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-wide">ELEVATE</span>
              <span className="text-[8px] font-medium tracking-[0.25em] text-muted-foreground uppercase">
                Wellness Hub
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {menuItems.map((item) => (
          <NavItem key={item.tab} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border/60">
        {/* User info */}
        {user && !collapsed && (
          <div className="px-5 pt-3 pb-1">
            <p className="text-[11px] text-muted-foreground truncate font-medium">
              {user.user_metadata?.full_name || user.email}
            </p>
          </div>
        )}

        <div className={cn(
          "flex items-center gap-1 px-3 py-3",
          collapsed && "flex-col"
        )}>
          {/* Sign out */}
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Sign Out</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <LogOut className="h-[18px] w-[18px]" />
              <span>Sign Out</span>
            </button>
          )}

          {/* Collapse toggle */}
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setCollapsed(false)}
                  className="flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <PanelLeft className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Expand</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => setCollapsed(true)}
              className="ml-auto flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <PanelLeftClose className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default AdminNavbar;
