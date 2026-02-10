/**
 * 共通アニメーション定義（framer-motion）
 * 設計: アニメーション設計書（React, Next.js想定）
 */

export const transitionPresets = {
  fast: { duration: 0.15, ease: "easeOut" as const },
  normal: { duration: 0.25, ease: "easeOut" as const },
  slow: { duration: 0.4, ease: "easeOut" as const },
} as const;

export const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

/** ヒーロー用: 画像 → タイトル → サブタイトルを 0.05s ずつ遅延 */
export const heroStaggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};
