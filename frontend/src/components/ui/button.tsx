import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        default: "bg-[#86a197] text-white shadow-[0_10px_22px_rgba(95,121,116,.22)] hover:-translate-y-0.5 hover:bg-[#5f7974] hover:shadow-[0_16px_28px_rgba(95,121,116,.28)]",
        outline: "border border-[#c7c1b5] bg-[#faf8ef]/80 text-[#2a3234] shadow-[inset_0_1px_0_rgba(255,255,255,.75)] hover:-translate-y-0.5 hover:border-[#9aa9a2] hover:bg-[#faf8ef] hover:shadow-md",
        ghost: "text-[#4a5657] hover:-translate-y-0.5 hover:bg-[#e6efe5]/80 hover:text-[#2a3234]",
        destructive: "bg-[#c77272] text-white shadow-[0_10px_22px_rgba(199,114,114,.22)] hover:-translate-y-0.5 hover:bg-[#ad5555]"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
));
Button.displayName = "Button";



