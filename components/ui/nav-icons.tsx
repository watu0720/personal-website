import { Home, User, Youtube, Play, Code, Search } from "lucide-react";

export const NavIcons = {
  Home,
  User,
  Youtube,
  Play, // ニコニコ用
  Code, // 開発用
  Search,
} as const;

export type NavIconName = keyof typeof NavIcons;