"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";

export function useGsapContext(
  scope: React.RefObject<HTMLElement | null>,
  fn: (ctx: gsap.Context) => void,
  deps: React.DependencyList = [],
) {
  useLayoutEffect(() => {
    if (!scope.current) return;
    const ctx = gsap.context((self) => fn(self), scope);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
