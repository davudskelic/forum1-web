import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-semibold transition-all duration-150 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34abc0] focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        primary:
          "bg-[#34abc0] text-white hover:bg-[#2a8fa1] active:scale-[0.98] shadow-sm",
        secondary:
          "bg-white text-[#0f172a] border border-[#e2e8f0] hover:bg-[#f8fafb] hover:border-[#cbd5e1] shadow-sm",
        ghost:
          "bg-transparent text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]",
        danger:
          "bg-[#ef4444] text-white hover:bg-[#dc2626] active:scale-[0.98] shadow-sm",
        outline:
          "border-2 border-[#34abc0] text-[#34abc0] bg-transparent hover:bg-[#e6f6f9]",
        link:
          "text-[#34abc0] hover:text-[#2a8fa1] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        xl: "h-13 px-8 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";
