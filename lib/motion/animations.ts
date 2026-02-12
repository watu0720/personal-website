import type gsap from "gsap";

export const EASE_OUT = "power2.out" as const;

export function fadeInUp(
  _target: gsap.TweenTarget,
  opts?: { duration?: number; y?: number },
) {
  const duration = opts?.duration ?? 0.35;
  const y = opts?.y ?? 10;
  return { opacity: 0, y, duration, ease: EASE_OUT };
}

export function pop(
  _target: gsap.TweenTarget,
  opts?: { duration?: number; scale?: number },
) {
  const duration = opts?.duration ?? 0.18;
  const scale = opts?.scale ?? 1.02;
  return { scale, duration, ease: EASE_OUT };
}
