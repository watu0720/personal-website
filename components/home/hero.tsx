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
      className="mb-12 overflow-hidden rounded-3xl border bg-gradient-to-br from-card via-card to-card/80 shadow-lg"
      variants={heroStaggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div
        variants={staggerItem}
        transition={transitionPresets.normal}
        className="relative h-56 w-full sm:h-72 md:h-80"
      >
        <Image
          src={imgSrc}
          alt="ヘッダー"
          fill
          className="object-cover"
          priority
          unoptimized={imgSrc.startsWith("http")}
        />
        {/* グラデーションオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* 装飾的な要素 */}
        <div className="absolute top-4 right-4 h-16 w-16 rounded-full bg-primary/20 blur-xl" />
        <div className="absolute bottom-6 left-6 h-12 w-12 rounded-full bg-accent/30 blur-lg" />
      </motion.div>
      
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="relative p-8 bg-gradient-to-r from-primary/5 via-transparent to-accent/5"
      >
        {/* 背景装飾 */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,hsl(var(--primary))_0%,transparent_50%)] opacity-5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,hsl(var(--accent))_0%,transparent_50%)] opacity-5" />
        
        <div className="relative z-10">
          <motion.h1
            variants={staggerItem}
            transition={transitionPresets.normal}
            className="mb-3 text-3xl md:text-4xl font-bold text-foreground text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
          >
            {title}
          </motion.h1>
          <motion.p
            variants={staggerItem}
            transition={transitionPresets.normal}
            className="text-base leading-relaxed text-muted-foreground max-w-2xl"
          >
            {subtitle}
          </motion.p>
          
          {/* 装飾的なライン */}
          <motion.div
            variants={staggerItem}
            transition={transitionPresets.normal}
            className="mt-6 h-1 w-24 bg-gradient-to-r from-primary to-accent rounded-full"
          />
        </div>
      </motion.div>
    </motion.section>
  );
}
