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
      className="mb-12 overflow-hidden rounded-3xl border bg-gradient-to-br from-card to-card/80 shadow-lg"
    >
      {children}
    </motion.div>
  );
}
