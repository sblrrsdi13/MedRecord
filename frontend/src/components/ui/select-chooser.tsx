"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type SelectChooserOption = {
  value: string;
  label: string;
  description?: string;
};

type SelectChooserProps = {
  name: string;
  value?: string;
  defaultValue?: string;
  options: SelectChooserOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onValueChange?: (value: string) => void;
};

export function SelectChooser({
  name,
  value,
  defaultValue = "",
  options,
  placeholder = "Pilih data",
  required,
  disabled,
  className,
  onValueChange
}: SelectChooserProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const selectedValue = isControlled ? value : internalValue;
  const selectedOption = useMemo(() => options.find((option) => option.value === selectedValue), [options, selectedValue]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function selectValue(nextValue: string) {
    if (!isControlled) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-[#c7c1b5] bg-[#faf8ef]/84 px-4 text-left text-sm shadow-inner shadow-stone-300/20 transition",
          "hover:-translate-y-0.5 hover:border-[#9aa9a2] hover:bg-[#faf8ef] hover:shadow-md",
          "focus:outline-none focus:ring-2 focus:ring-[#86a197]/25",
          open && "border-[#9aa9a2] bg-white shadow-lg shadow-stone-900/10",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate font-semibold", selectedOption ? "text-[#2a3234]" : "text-[#7a827e]")}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-[#7a827e] transition", open && "rotate-180 text-[#5f7974]")} />
      </button>

      <input name={name} value={selectedValue ?? ""} required={required} readOnly hidden />

      {open && (
        <div className="absolute left-0 top-[calc(100%+10px)] z-[90] max-h-72 w-full min-w-[220px] overflow-y-auto rounded-2xl border border-white/70 bg-[#f8fbfb]/96 p-2 text-[#315256] shadow-[0_22px_60px_rgba(49,82,86,.22)] backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 duration-150 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {options.map((option) => {
            const selected = option.value === selectedValue;
            return (
              <button
                key={`${option.value}-${option.label}`}
                type="button"
                onClick={() => selectValue(option.value)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                  selected ? "bg-black text-white shadow-[0_10px_24px_rgba(0,0,0,.16)]" : "hover:bg-white hover:shadow-sm"
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{option.label}</span>
                  {option.description && <span className={cn("mt-0.5 block truncate text-xs", selected ? "text-white/70" : "text-[#7a827e]")}>{option.description}</span>}
                </span>
                {selected && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
