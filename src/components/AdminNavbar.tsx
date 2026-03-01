import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, LayoutDashboard, Users, Settings, Tag, CalendarCheck, Eye, Building2, GraduationCap, Gamepad2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const allMenuItems = [
  { label: "Academies", icon: GraduationCap, tab: "academies" },
  { label: "Bookings", icon: CalendarCheck, tab: "bookings" },
  { label: "Clubs & Partners", icon: Building2, tab: "clubs" },
  { label: "Customer Vision", icon: Eye, tab: "customer-vision" },
  { label: "Dashboard", icon: LayoutDashboard, tab: "overview" },
  { label: "MyPlayer", icon: Gamepad2, tab: "myplayer" },
  { label: "Promotions", icon: Tag, tab: "promotions" },
  { label: "Settings", icon: Settings, tab: "settings" },
  { label: "Users", icon: Users, tab: "users" },
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

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "fixed top-0 left-0 h-screen z-50 flex flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center px-4 py-5 border-b border-border", collapsed && "justify-center px-2")}>
        <button
          onClick={() => onTabChange("overview")}
          className="font-heading font-bold tracking-tight text-foreground cursor-pointer"
        >
          {collapsed ? (
            <span className="text-lg font-bold">E</span>
          ) : (
            <>
              <span className="text-lg font-bold">ELEVATE</span>
              <br />
              <span className="text-[9px] font-medium tracking-[0.2em] text-muted-foreground">WELLNESS HUB</span>
            </>
          )}
        </button>
      </div>

      {/* Menu items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {menuItems.map((item) => (
          <button
            key={item.tab}
            onClick={() => onTabChange(item.tab)}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              collapsed && "justify-center px-0",
              activeTab === item.tab
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom: user + sign out + collapse */}
      <div className="border-t border-border p-3 space-y-2">
        {user && !collapsed && (
          <p className="text-xs text-muted-foreground truncate px-1">
            {user.user_metadata?.full_name || user.email}
          </p>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
              collapsed && "justify-center px-0 w-full"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex justify-center p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.aside>
  );
};

export default AdminNavbar;
