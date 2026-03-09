import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-mobile";

interface MobileBackButtonProps {
  /** Override the default back behavior with a specific path */
  fallbackPath?: string;
  /** Optional label next to the arrow */
  label?: string;
}

/**
 * A persistent back button for secondary screens (not main tabs).
 * Only visible on small mobile devices (< 640px) where there's no browser back button.
 * Positioned below the Navbar as part of the page content flow.
 */
const MobileBackButton = ({ fallbackPath = "/", label }: MobileBackButtonProps) => {
  const navigate = useNavigate();
  const isSmallMobile = useMediaQuery("(max-width: 639px)");

  if (!isSmallMobile) return null;

  const handleBack = () => {
    // If there's history, go back. Otherwise go to fallback.
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors py-2 px-1 -ml-1"
      aria-label="Go back"
    >
      <ArrowLeft className="h-5 w-5" />
      {label && <span className="text-xs font-medium uppercase tracking-wider">{label}</span>}
    </button>
  );
};

export default MobileBackButton;
