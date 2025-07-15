import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

/**
 * Custom loading spinner component with circular animation
 * Inspired by modern loading animations, uses black/gray color scheme
 *
 * @param size - Size variant: "sm" (24px), "md" (32px), "lg" (48px)
 * @param className - Additional CSS classes
 * @param text - Loading text to display below spinner
 *
 * @example
 * // Basic usage
 * <LoadingSpinner />
 *
 * @example
 * // Large spinner with custom text
 * <LoadingSpinner size="lg" text="Loading posts..." />
 *
 * @example
 * // Small spinner without text
 * <LoadingSpinner size="sm" text="" />
 */
export function LoadingSpinner({
  size = "md",
  className,
  text = "Loadingss...",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-4",
        className
      )}
    >
      <div className="relative inline-block">
        {/* Spinning border */}
        <div
          className={cn(
            "rounded-full border-4 border-gray-300 border-t-black animate-spin",
            sizeClasses[size]
          )}
        />
      </div>
      {text && (
        <p className={cn("text-gray-700 font-medium", textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );
}
