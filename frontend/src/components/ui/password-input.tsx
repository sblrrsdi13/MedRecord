"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  inputClassName?: string;
};

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, inputClassName, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const Icon = visible ? EyeOff : Eye;

    return (
      <div className={cn("relative w-full", className)}>
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("password-field pr-11", inputClassName)}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? "Sembunyikan password" : "Lihat password"}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
          className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#6a746f] transition hover:bg-[#e6efe5] hover:text-[#5f7974] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86a197]/35"
        >
          <Icon className="h-4 w-4" />
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
