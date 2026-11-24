import { AVAILABILITY_BADGES, type ProductAvailability } from "@bumbuket/shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AvailabilityBadgeProps {
  type: ProductAvailability;
  compact?: boolean;
  className?: string;
}

export function AvailabilityBadge({
  type,
  compact = false,
  className,
}: AvailabilityBadgeProps) {
  const meta = AVAILABILITY_BADGES[type];
  const isReady = type === "ready_stock";

  return (
    <Badge
      variant={isReady ? "ready" : "preorder"}
      className={cn("backdrop-blur-sm shadow-sm", className)}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isReady ? "bg-emerald-500 animate-pulse" : "bg-brand-pink"
        )}
      />
      <span>{compact ? meta.shortLabel : meta.label}</span>
    </Badge>
  );
}

