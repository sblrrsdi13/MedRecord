"use client";

import { LanguageProvider } from "@/contexts/language-context";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { primeSiteCms } from "@/hooks/use-site-cms";
import type { SiteCms } from "@/types/site-cms";

export function RootLayoutClient({ children, initialCms }: { children: ReactNode; initialCms: SiteCms }) {
  primeSiteCms(initialCms);

  useEffect(() => {
    const patterns = [/^bis_/, /^__processed_/];

    const clean = (node: Node) => {
      if (!(node instanceof Element)) return;

      Array.from(node.attributes).forEach((attribute) => {
        if (patterns.some((pattern) => pattern.test(attribute.name))) {
          node.removeAttribute(attribute.name);
        }
      });
    };

    clean(document.documentElement);
    if (document.body) clean(document.body);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes") clean(mutation.target);
      });
    });

    observer.observe(document.documentElement, {
      attributes: true
    });
    if (document.body) observer.observe(document.body, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return <LanguageProvider>{children}</LanguageProvider>;
}



