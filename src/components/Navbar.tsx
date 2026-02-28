import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/book", label: "Book Now" },
  { to: "/academy", label: "Academies" },
  { to: "/clubs", label: "Clubs & Partners" },
  { to: "/loyalty", label: "Loyalty" },
];

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="container mx-auto grid grid-cols-3 items-center px-6 py-4">
        {/* Left: Logo */}
        <Link to="/" className="font-heading font-bold tracking-tight text-foreground justify-self-start">
          <span className="text-xl font-bold">ELEVATE</span>
          <br />
          <span className="text-[10px] font-medium tracking-[0.25em] text-muted-foreground">WELLNESS HUB</span>
        </Link>

        {/* Center: Nav Links */}
        <div className="justify-self-center flex items-center gap-6">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "text-sm font-medium tracking-wide transition-colors whitespace-nowrap",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
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

        {/* Right: Admin + Auth */}
        <div className="flex items-center gap-3 justify-self-end">
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
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="hidden md:inline">
                  {user.user_metadata?.full_name || user.email}
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-full bg-secondary px-3 py-2 text-xs md:px-4 md:py-2.5 md:text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-all flex items-center gap-1.5 md:gap-2"
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
      </div>
    </motion.nav>
  );
};

export default Navbar;
