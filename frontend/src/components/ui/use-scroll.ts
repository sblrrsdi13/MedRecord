"use client";

import React from "react";

export function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(false);
  const scrolledRef = React.useRef(false);
  const frameRef = React.useRef<number | null>(null);

  const onScroll = React.useCallback(() => {
    if (frameRef.current !== null) return;

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      const next = window.scrollY > threshold;
      if (next === scrolledRef.current) return;
      scrolledRef.current = next;
      setScrolled(next);
    });
  }, [threshold]);

  React.useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [onScroll]);

  React.useEffect(() => {
    onScroll();
  }, [onScroll]);

  return scrolled;
}



