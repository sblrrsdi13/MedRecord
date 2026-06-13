"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FormActionModalProps = {
  title: string;
  description?: string;
  triggerLabel: string;
  children: ReactNode;
  className?: string;
};

type FormModalShellProps = {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function FormModalShell({ title, description, open, onClose, children, className }: FormModalShellProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] grid min-h-screen place-items-center overflow-y-auto bg-stone-950/70 p-4 backdrop-blur-md">
      <button className="fixed inset-0 cursor-default" aria-label="Tutup popup" onClick={onClose} />
      <section className={cn("relative mx-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border bg-white shadow-2xl animate-in", className)}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white/95 p-5 backdrop-blur">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Tutup popup" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </section>
    </div>,
    document.body
  );
}

export function FormActionModal({ title, description, triggerLabel, children, className }: FormActionModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="shadow-sm">
        <Plus className="h-4 w-4" />
        {triggerLabel}
      </Button>

      <FormModalShell title={title} description={description} open={open} onClose={() => setOpen(false)} className={className}>
        {children}
      </FormModalShell>
    </>
  );
}



