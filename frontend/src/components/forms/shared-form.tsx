import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SharedFormFieldState = "default" | "error";

export const sharedFormStyles = {
  form: "space-y-6",
  section: "space-y-4",
  sectionHeader: "flex items-center gap-2 border-b border-[#c7c1b5] pb-2",
  sectionTitle: "text-xs font-bold uppercase tracking-[0.05em] text-[#5f7974]",
  sectionDescription: "text-sm text-[#4a5657]",
  field: "space-y-1.5",
  fieldGroup: "grid grid-cols-2 gap-3",
  label: "text-xs font-semibold text-[#4a5657]",
  description: "text-xs text-[#7a827e]",
  helperText: "text-xs text-[#7a827e]",
  error: "text-xs font-medium text-destructive",
  actions: "sticky bottom-0 -mx-5 -mb-5 flex justify-end gap-3 border-t border-[#c7c1b5] bg-white/95 px-5 py-4 backdrop-blur",
} as const;

export const sharedInputClassName =
  "h-10 w-full rounded-md border border-[#c7c1b5] bg-white px-3 text-sm outline-none transition focus:border-[#5f7974] focus:ring-2 focus:ring-[#5f7974]/20";

export const sharedTextareaClassName =
  "min-h-24 w-full rounded-md border border-[#c7c1b5] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#5f7974] focus:ring-2 focus:ring-[#5f7974]/20";

export const sharedSelectTriggerClassName =
  "h-10 w-full rounded-md border border-[#c7c1b5] bg-white px-3 text-sm outline-none transition focus:border-[#5f7974] focus:ring-2 focus:ring-[#5f7974]/20";

export function getSharedFormFieldClassName(state: SharedFormFieldState = "default") {
  return state === "error" ? `${sharedFormStyles.field} text-destructive` : sharedFormStyles.field;
}

export function getSharedFormMessageClassName(state: SharedFormFieldState = "default") {
  return state === "error" ? sharedFormStyles.error : sharedFormStyles.helperText;
}

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={sharedFormStyles.field}>
      <span className={sharedFormStyles.label}>{label}</span>
      {children}
    </label>
  );
}

export function FormSection({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className={sharedFormStyles.section}>
      <div className={sharedFormStyles.sectionHeader}>
        <Icon className="h-4 w-4 text-[#5f7974]" />
        <h3 className={sharedFormStyles.sectionTitle}>{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function FormMessage({ message, error }: { message?: string | null; error?: string | null }) {
  if (!message && !error) return null;

  return (
    <div className="rounded-xl border bg-[#faf8ef] p-3">
      {message && <p className="text-sm text-[#5f7974]">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function FormActions({ submitLabel, submittingLabel, isSubmitting }: { submitLabel: string; submittingLabel?: string; isSubmitting?: boolean }) {
  return (
    <div className={sharedFormStyles.actions}>
      <Button type="reset" variant="outline">
        Reset
      </Button>
      <Button type="submit" className="bg-[#5f7974] hover:bg-[#86a197]" disabled={isSubmitting}>
        {isSubmitting ? submittingLabel ?? "Menyimpan..." : submitLabel}
      </Button>
    </div>
  );
}



