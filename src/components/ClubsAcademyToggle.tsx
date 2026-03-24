import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-mobile";

const ClubsAcademyToggle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSmallMobile = useMediaQuery("(max-width: 639px)");

  if (!isSmallMobile) return null;

  const isAcademy = location.pathname === "/academy";

  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl bg-secondary/80 w-full max-w-xs mx-auto mb-4">
      <button
        onClick={() => !isAcademy || navigate("/clubs")}
        className={cn(
          "flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all text-center",
          !isAcademy
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Clubs & Partners
      </button>
      <button
        onClick={() => isAcademy || navigate("/academy")}
        className={cn(
          "flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all text-center",
          isAcademy
            ? "bg-accent text-accent-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Academies
      </button>
    </div>
  );
};

export default ClubsAcademyToggle;
