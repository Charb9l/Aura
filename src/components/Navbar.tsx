import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, ShieldCheck } from "lucide-react";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="font-heading font-bold tracking-tight text-foreground">
          <span className="text-xl font-bold">ELEVATE</span>
          <br />
          <span className="text-[10px] font-medium tracking-[0.25em] text-muted-foreground">WELLNESS HUB</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <Link to="/book" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Book Now
          </Link>
          <Link to="/academy" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Academy
          </Link>
          <Link to="/clubs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Clubs & Partners
          </Link>
          <Link to="/loyalty" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Loyalty Program
          </Link>
        </div>
        <div className="flex items-center gap-3">
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
