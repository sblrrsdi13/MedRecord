"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type DateChooserProps = {
  name: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
  onValueChange?: (value: string) => void;
};

const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
type PickerMode = "day" | "month" | "year";

function toDate(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string) {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatMonthTitle(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isOutOfRange(date: Date, min?: string, max?: string) {
  const value = toInputValue(date);
  return Boolean((min && value < min) || (max && value > max));
}

function buildCalendarDays(viewDate: Date) {
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const blanks = Array.from({ length: firstDay.getDay() }, () => null);
  const dates = Array.from({ length: daysInMonth }, (_, index) => new Date(viewDate.getFullYear(), viewDate.getMonth(), index + 1));
  return [...blanks, ...dates];
}

function getYearRange(viewDate: Date) {
  const start = Math.floor(viewDate.getFullYear() / 12) * 12;
  return Array.from({ length: 12 }, (_, index) => start + index);
}

function getMinYear(min?: string) {
  return toDate(min)?.getFullYear();
}

function getMaxYear(max?: string) {
  return toDate(max)?.getFullYear();
}

function isMonthOutOfRange(year: number, monthIndex: number, min?: string, max?: string) {
  const firstDay = toInputValue(new Date(year, monthIndex, 1));
  const lastDay = toInputValue(new Date(year, monthIndex + 1, 0));
  return Boolean((min && lastDay < min) || (max && firstDay > max));
}

export function DateChooser({
  name,
  value,
  defaultValue = "",
  required,
  disabled,
  min,
  max,
  placeholder = "Pilih tanggal",
  className,
  onValueChange
}: DateChooserProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = isControlled ? value : internalValue;
  const selectedDate = toDate(selectedValue);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PickerMode>("day");
  const [viewDate, setViewDate] = useState(() => selectedDate ?? toDate(max) ?? new Date());
  const label = useMemo(() => formatDateLabel(selectedValue ?? ""), [selectedValue]);
  const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate]);
  const years = useMemo(() => getYearRange(viewDate), [viewDate]);
  const minYear = getMinYear(min);
  const maxYear = getMaxYear(max);

  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
  }, [selectedValue]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function setSelectedValue(nextValue: string) {
    if (!isControlled) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  }

  function moveMonth(step: number) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + step, 1));
  }

  function moveView(step: number) {
    if (mode === "year") {
      setViewDate((current) => new Date(current.getFullYear() + step * 12, current.getMonth(), 1));
      return;
    }

    if (mode === "month") {
      setViewDate((current) => new Date(current.getFullYear() + step, current.getMonth(), 1));
      return;
    }

    moveMonth(step);
  }

  function selectYear(year: number) {
    if ((minYear && year < minYear) || (maxYear && year > maxYear)) return;
    setViewDate((current) => new Date(year, current.getMonth(), 1));
    setMode("month");
  }

  function selectMonth(monthIndex: number) {
    if (isMonthOutOfRange(viewDate.getFullYear(), monthIndex, min, max)) return;
    setViewDate((current) => new Date(current.getFullYear(), monthIndex, 1));
    setMode("day");
  }

  function selectDate(date: Date) {
    if (disabled || isOutOfRange(date, min, max)) return;
    setSelectedValue(toInputValue(date));
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-[#c7c1b5] bg-[#faf8ef]/84 px-4 text-left text-sm shadow-inner shadow-stone-300/20 transition",
          "hover:-translate-y-0.5 hover:border-[#9aa9a2] hover:bg-[#faf8ef] hover:shadow-md",
          "focus:outline-none focus:ring-2 focus:ring-[#86a197]/25",
          open && "border-[#9aa9a2] bg-white shadow-lg shadow-stone-900/10",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <span className={cn("truncate font-semibold", selectedValue ? "text-[#2a3234]" : "text-[#7a827e]")}>
          {label || placeholder}
        </span>
        <span className={cn("h-2 w-2 rounded-full transition", selectedValue ? "bg-[#5f7974]" : "bg-[#c7c1b5]")} />
      </button>

      <input name={name} value={selectedValue ?? ""} required={required} readOnly hidden />

      {open && (
        <div className="absolute left-0 top-[calc(100%+10px)] z-[80] w-[256px] rounded-2xl border border-white/70 bg-[#f8fbfb]/96 p-4 text-[#315256] shadow-[0_22px_60px_rgba(49,82,86,.22)] backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="mb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => moveView(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#315256] transition hover:bg-[#e6efe5]"
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMode((current) => current === "year" ? "day" : "year")}
              className="rounded-full px-3 py-1 text-sm font-semibold text-[#123a3f] transition hover:bg-[#e6efe5]"
            >
              {mode === "year" ? `${years[0]} - ${years[years.length - 1]}` : mode === "month" ? viewDate.getFullYear() : formatMonthTitle(viewDate)}
            </button>
            <button
              type="button"
              onClick={() => moveView(1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#315256] transition hover:bg-[#e6efe5]"
              aria-label="Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {mode === "year" && (
            <div className="grid grid-cols-3 gap-2">
              {years.map((year) => {
                const selected = selectedDate?.getFullYear() === year;
                const disabledYear = Boolean((minYear && year < minYear) || (maxYear && year > maxYear));
                return (
                  <button
                    key={year}
                    type="button"
                    disabled={disabledYear}
                    onClick={() => selectYear(year)}
                    className={cn(
                      "flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition",
                      selected && "bg-black text-white shadow-[0_10px_24px_rgba(0,0,0,.18)]",
                      !selected && "bg-white/55 text-[#315256] hover:bg-white hover:shadow-sm",
                      disabledYear && "cursor-not-allowed bg-transparent text-[#b7c4c6] opacity-45 hover:bg-transparent hover:shadow-none"
                    )}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          )}

          {mode === "month" && (
            <div className="grid grid-cols-3 gap-2">
              {monthLabels.map((month, index) => {
                const selected = selectedDate?.getFullYear() === viewDate.getFullYear() && selectedDate.getMonth() === index;
                const disabledMonth = isMonthOutOfRange(viewDate.getFullYear(), index, min, max);
                return (
                  <button
                    key={month}
                    type="button"
                    disabled={disabledMonth}
                    onClick={() => selectMonth(index)}
                    className={cn(
                      "flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition",
                      selected && "bg-black text-white shadow-[0_10px_24px_rgba(0,0,0,.18)]",
                      !selected && "bg-white/55 text-[#315256] hover:bg-white hover:shadow-sm",
                      disabledMonth && "cursor-not-allowed bg-transparent text-[#b7c4c6] opacity-45 hover:bg-transparent hover:shadow-none"
                    )}
                  >
                    {month}
                  </button>
                );
              })}
            </div>
          )}

          {mode === "day" && (
            <div className="grid grid-cols-7 gap-y-2 text-center">
              {dayLabels.map((day) => (
                <span key={day} className="text-xs font-medium text-[#8ba1a4]">
                  {day}
                </span>
              ))}
              {calendarDays.map((date, index) => {
                if (!date) return <span key={`blank-${index}`} className="h-8" />;

                const selected = selectedDate ? isSameDate(date, selectedDate) : false;
                const today = isSameDate(date, new Date());
                const outOfRange = isOutOfRange(date, min, max);

                return (
                  <button
                    key={toInputValue(date)}
                    type="button"
                    disabled={outOfRange}
                    onClick={() => selectDate(date)}
                    className={cn(
                      "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition",
                      selected && "bg-black text-white shadow-[0_10px_24px_rgba(0,0,0,.2)]",
                      !selected && today && "bg-[#e6efe5] text-[#315256]",
                      !selected && !today && "text-[#315256] hover:bg-white hover:shadow-sm",
                      outOfRange && "cursor-not-allowed text-[#b7c4c6] opacity-45 hover:bg-transparent hover:shadow-none"
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
