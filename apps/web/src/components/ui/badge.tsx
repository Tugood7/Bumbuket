import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "bg-brand-rose text-white",
        blush: "bg-brand-blush text-brand-rose",
        ready: "bg-emerald-50 text-emerald-800 border border-emerald-200",
        preorder: "bg-pink-50 text-brand-rose border border-pink-200",
        outline: "border border-pink-200 bg-white/90 text-foreground",
      },
    },
    defaultVariants: {
      variant: "blush",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

