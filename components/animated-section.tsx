"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { fadeInUp, transitionPresets } from "@/lib/animations";

type AnimatedSectionProps = {
  children: React.ReactNode;
  className?: string;
  /** ビューポートに入ってからアニメーション開始する閾値（0〜1） */
  amount?: number;
};

/**
 * スクロールで表示域に入ったらフェード＋少し上から表示。
 * 設計書 Phase 1.3 想定。
 */
export function AnimatedSection({
  children,
  className,
  amount = 0.15,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount });

  return (
    <motion.div
      ref={ref}
      initial={fadeInUp.initial}
      animate={inView ? fadeInUp.animate : fadeInUp.initial}
      transition={transitionPresets.normal}
      className={className}
    >
      {children}
    </motion.div>
  );
}
