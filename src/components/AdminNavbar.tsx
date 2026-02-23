import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Menu, LayoutDashboard, Users, ShieldCheck, BarChart3, Settings, Tag, Building2 } from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, tab: "overview" },
  { label: "Users", icon: Users, tab: "users" },
  { label: "Admins", icon: ShieldCheck, tab: "admins" },
  { label: "Clubs & Partners", icon: Building2, tab: "clubs" },
  { label: "Reporting", icon: BarChart3, tab: "reporting" },
  { label: "Settings", icon: Settings, tab: "settings" },
  { label: "Promotions", icon: Tag, tab: "promotions" },
];

interface AdminNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminNavbar = ({ activeTab, onTabChange }: AdminNavbarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activeLabel = menuItems.find((m) => m.tab === activeTab)?.label || "Dashboard";

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        {/* Left: Logo + Dropdown */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onTabChange("overview")}
            className="font-heading font-bold tracking-tight text-foreground cursor-pointer"
          >
            <span className="text-xl font-bold">ELEVATE</span>
            <br />
            <span className="text-[10px] font-medium tracking-[0.25em] text-muted-foreground">WELLNESS HUB</span>
          </button>

          {/* Dropdown menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/80 transition-all"
            >
              <Menu className="h-4 w-4" />
              {activeLabel}
              <svg
                className={`h-3 w-3 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 10 6"
              >
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
              </svg>
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 z-50 w-52 rounded-xl border border-border bg-card shadow-xl overflow-hidden"
                >
                  <div className="py-1.5">
                    {menuItems.map((item) => (
                      <button
                        key={item.tab}
                        onClick={() => {
                          onTabChange(item.tab);
                          setMenuOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          activeTab === item.tab
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: User + Sign out */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              <span className="hidden md:block text-sm text-muted-foreground">
                {user.user_metadata?.full_name || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="rounded-full bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-all flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default AdminNavbar;
