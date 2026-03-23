import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
}

/**
 * Custom SVG icon for Clubs & Partners.
 * A stylised twin-building silhouette with a connecting arc — conveys partnership/venues.
 */
export const ClubsIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("shrink-0", className)} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {/* Left building */}
    <rect x="3" y="8" width="7" height="13" rx="1.5" />
    <line x1="5" y1="11" x2="5" y2="11.01" strokeWidth="2" />
    <line x1="8" y1="11" x2="8" y2="11.01" strokeWidth="2" />
    <line x1="5" y1="14.5" x2="5" y2="14.51" strokeWidth="2" />
    <line x1="8" y1="14.5" x2="8" y2="14.51" strokeWidth="2" />
    {/* Right building */}
    <rect x="14" y="5" width="7" height="16" rx="1.5" />
    <line x1="16" y1="8.5" x2="16" y2="8.51" strokeWidth="2" />
    <line x1="19" y1="8.5" x2="19" y2="8.51" strokeWidth="2" />
    <line x1="16" y1="12" x2="16" y2="12.01" strokeWidth="2" />
    <line x1="19" y1="12" x2="19" y2="12.01" strokeWidth="2" />
    {/* Connecting arch */}
    <path d="M10 12 Q12 3 14 8" strokeWidth="1.4" />
  </svg>
);

/**
 * Custom SVG icon for Academies.
 * An open book with a rising star — conveys learning & excellence.
 */
export const AcademiesIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("shrink-0", className)} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {/* Open book */}
    <path d="M2 19.5V6a2 2 0 012-2h6c1.1 0 2 .9 2 2v13.5" />
    <path d="M22 19.5V6a2 2 0 00-2-2h-6c-1.1 0-2 .9-2 2v13.5" />
    <path d="M2 19.5h20" />
    {/* Star above */}
    <path d="M12 2l1 2.2 2.4.2-1.8 1.6.5 2.4L12 7.2l-2.1 1.2.5-2.4L8.6 4.4l2.4-.2L12 2z" fill="currentColor" fillOpacity="0.15" strokeWidth="1.2" />
  </svg>
);

/**
 * Custom SVG icon for Matchmaker.
 * Two figures with a connecting spark — conveys finding your match.
 */
export const MatchmakerIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("shrink-0", className)} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {/* Left person */}
    <circle cx="7" cy="6" r="2.5" />
    <path d="M2 21v-4a4 4 0 014-4h2" />
    {/* Right person */}
    <circle cx="17" cy="6" r="2.5" />
    <path d="M22 21v-4a4 4 0 00-4-4h-2" />
    {/* Spark / connection */}
    <path d="M12 11l-1.5 2.5h3L12 16" strokeWidth="1.8" fill="currentColor" fillOpacity="0.1" />
  </svg>
);

/**
 * Custom SVG icon for Habit Tracker.
 * A rising trend line with pulse dots — conveys tracking & progress.
 */
export const HabitTrackerIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("shrink-0", className)} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 20l4-8 4 5 4-10 4 5h2" />
    <circle cx="7" cy="12" r="1.5" fill="currentColor" fillOpacity="0.15" />
    <circle cx="11" cy="17" r="1.5" fill="currentColor" fillOpacity="0.15" />
    <circle cx="15" cy="7" r="1.5" fill="currentColor" fillOpacity="0.15" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

/**
 * Custom SVG icon for Loyalty.
 * A star with radiating accent — conveys rewards & achievement.
 */
export const LoyaltyIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("shrink-0", className)} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12,2 14.5,9 22,9 16,13.5 18,21 12,17 6,21 8,13.5 2,9 9.5,9" fill="currentColor" fillOpacity="0.08" />
    <polygon points="12,2 14.5,9 22,9 16,13.5 18,21 12,17 6,21 8,13.5 2,9 9.5,9" />
  </svg>
);
