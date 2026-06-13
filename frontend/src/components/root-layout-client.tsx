"use client";

import { LanguageProvider } from "@/contexts/language-context";
import { useEffect } from "react";
import type { ReactNode } from "react";

export function RootLayoutClient({ children }: { children: ReactNode }) {
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

    const cleanTree = () => {
      clean(document.documentElement);
      if (document.body) clean(document.body);
      document.querySelectorAll("*").forEach(clean);
    };

    cleanTree();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes") clean(mutation.target);
        mutation.addedNodes.forEach(clean);
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, []);

  return <LanguageProvider>{children}</LanguageProvider>;
}



