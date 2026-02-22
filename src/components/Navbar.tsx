import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Navbar = () => {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="font-heading text-2xl font-bold tracking-tight text-foreground">
          COURT<span className="text-gradient">SIDE</span>
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
        </div>
        <Link
          to="/book"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:glow"
        >
          Book a Session
        </Link>
      </div>
    </motion.nav>
  );
};

export default Navbar;
