"use client";

import gsap from "gsap";

export function pulseElement(el: HTMLElement) {
  gsap.fromTo(
    el,
    { scale: 1 },
    {
      scale: 1.02,
      duration: 0.12,
      yoyo: true,
      repeat: 1,
      ease: "power2.out",
    },
  );
}
