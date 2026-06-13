import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-xl border border-[#c7c1b5] bg-[#faf8ef]/75 px-3 py-2 text-sm outline-none shadow-inner shadow-stone-300/20 ring-offset-background transition placeholder:text-[#7a827e] focus-visible:border-[#86a197] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#86a197]/25 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";



