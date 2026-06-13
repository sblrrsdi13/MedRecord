import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-[#86a197] text-white shadow-sm",
  secondary: "bg-[#e6efe5] text-[#4a5657]",
  success: "bg-[#dce9dd] text-[#58736a]",
  warning: "bg-[#f1e5c8] text-[#8a6a2f]",
  destructive: "bg-[#ead3d3] text-[#a75a5a]"
};

export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", variants[variant], className)} {...props} />;
}



