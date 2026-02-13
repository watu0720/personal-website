import { Home, User, Youtube, Play, Code, Search, Newspaper } from "lucide-react";

export const NavIcons = {
  Home,
  User,
  Youtube,
  Play, // ニコニコ用
  Code, // 開発用
  Search,
  Newspaper, // お知らせ用
} as const;

export type NavIconName = keyof typeof NavIcons;