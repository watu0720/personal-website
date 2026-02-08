"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const PATH_TO_PAGE_KEY: Record<string, string> = {
  "/": "home",
  "/profile": "profile",
  "/youtube": "youtube",
  "/niconico": "niconico",
  "/dev": "dev",
};

function getPageKey(pathname: string): string | null {
  const key = PATH_TO_PAGE_KEY[pathname];
  if (key) return key;
  return null;
}

export function VisitTracker() {
  const pathname = usePathname();
  const lastRecorded = useRef<string | null>(null);

  useEffect(() => {
    const pageKey = getPageKey(pathname ?? "/");
    if (!pageKey || lastRecorded.current === pageKey) return;
    lastRecorded.current = pageKey;
    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_key: pageKey }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
