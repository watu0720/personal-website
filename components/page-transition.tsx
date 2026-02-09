"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/**
 * ルート変更時にメインコンテンツを短いフェードで表示（設計書 Phase 1.2）
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0.95 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.03 }}
    >
      {children}
    </motion.div>
  );
}
