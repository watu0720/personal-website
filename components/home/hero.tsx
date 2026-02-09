"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { heroStaggerContainer, staggerContainer, staggerItem, transitionPresets } from "@/lib/animations";

type HomeHeroProps = {
  headerImageUrl?: string | null;
  title?: string;
  subtitle?: string;
};

export function HomeHero({
  headerImageUrl,
  title = "わっつーのHP へようこそ",
  subtitle = "動画投稿・開発活動などをまとめた個人ホームページです。",
}: HomeHeroProps) {
  const imgSrc = headerImageUrl || "/placeholder.svg";
  return (
    <motion.section
      className="mb-10 overflow-hidden rounded-2xl border bg-card"
      variants={heroStaggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div
        variants={staggerItem}
        transition={transitionPresets.normal}
        className="relative h-48 w-full sm:h-64"
      >
        <Image
          src={imgSrc}
          alt="ヘッダー"
          fill
          className="object-cover"
          priority
          unoptimized={imgSrc.startsWith("http")}
        />
      </motion.div>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="p-6"
      >
        <motion.h1
          variants={staggerItem}
          transition={transitionPresets.normal}
          className="mb-2 text-2xl font-bold text-foreground text-balance"
        >
          {title}
        </motion.h1>
        <motion.p
          variants={staggerItem}
          transition={transitionPresets.normal}
          className="text-sm leading-relaxed text-muted-foreground"
        >
          {subtitle}
        </motion.p>
      </motion.div>
    </motion.section>
  );
}
