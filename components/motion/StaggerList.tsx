"use client";

import { useRef } from "react";
import gsap from "gsap";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";
import { useGsapContext } from "@/lib/motion/useGsapContext";

export function StaggerList({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGsapContext(ref, () => {
    if (reduced) return;
    const items = ref.current?.querySelectorAll("[data-stagger-item]");
    if (!items || items.length === 0) return;

    gsap.fromTo(
      items,
      { opacity: 0, y: 10 },
      {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: "power2.out",
        stagger: 0.06,
      },
    );
  }, [reduced]);

  return <div ref={ref}>{children}</div>;
}
