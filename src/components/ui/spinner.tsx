import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-8 w-8",
};

export const Spinner = ({ className, size = "md" }: SpinnerProps) => (
  <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
);

interface PageLoaderProps {
  message?: string;
}

export const PageLoader = ({ message = "Loading..." }: PageLoaderProps) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <Spinner size="lg" className="text-primary" />
    <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
  </div>
);

interface ButtonContentProps {
  loading?: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export const ButtonContent = ({ loading, children, loadingText }: ButtonContentProps) => {
  if (loading) {
    return (
      <span className="flex items-center gap-2">
        <Spinner size="sm" />
        {loadingText || "Loading..."}
      </span>
    );
  }
  return <>{children}</>;
};
