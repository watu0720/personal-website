"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";

export function ModalMotion({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    if (!ref.current) return;
    if (open) {
      gsap.fromTo(
        ref.current,
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.2, ease: "power2.out" },
      );
    }
  }, [open, reduced]);

  return <div ref={ref}>{children}</div>;
}
