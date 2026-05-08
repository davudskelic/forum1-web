import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full text-xs font-semibold px-2.5 py-0.5 transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#e6f6f9] text-[#2a8fa1]",
        primary: "bg-[#34abc0] text-white",
        secondary: "bg-[#f1f5f9] text-[#475569]",
        danger: "bg-[#fef2f2] text-[#ef4444]",
        success: "bg-[#f0fdf4] text-[#22c55e]",
        warning: "bg-[#fffbeb] text-[#f59e0b]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
