"use client";

import { motion } from "framer-motion";
import { fadeInUp, transitionPresets } from "@/lib/animations";

/**
 * プロフィールページのヒーローカードを包み、表示時にフェード＋少し上から表示（設計書 Phase 2.3）
 */
export function ProfileHeroCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={fadeInUp.initial}
      animate={fadeInUp.animate}
      transition={transitionPresets.normal}
      className="mb-8 overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      {children}
    </motion.div>
  );
}
