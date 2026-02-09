"use client";

import Image from "next/image";

const ICON_SIZE = 24;

type ServiceIconType = "youtube" | "niconico" | "github";

const CONFIG: Record<
  ServiceIconType,
  { src: string; alt: string; invertDark: boolean }
> = {
  youtube: { src: "/icons/youtube.png", alt: "YouTube", invertDark: false },
  niconico: { src: "/icons/niconico.png", alt: "ニコニコ", invertDark: true },
  github: { src: "/icons/github.png", alt: "GitHub", invertDark: true },
};

type Props = {
  type: ServiceIconType;
  /** Size in pixels. Default 24. Use 20 for small (h-4 w-4), 24 for default, 32–36 for H1. */
  size?: number;
  className?: string;
};

export function ServiceIcon({ type, size = ICON_SIZE, className = "" }: Props) {
  const { src, alt, invertDark } = CONFIG[type];
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`shrink-0 object-contain ${invertDark ? "dark:invert" : ""} ${className}`}
      unoptimized
    />
  );
}
