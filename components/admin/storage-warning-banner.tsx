"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, HardDrive, CheckCircle2 } from "lucide-react";

const WARN_THRESHOLD = 80;
const CRITICAL_THRESHOLD = 90;

type Usage = { usedBytes: number; limitBytes: number; percent: number } | null;

function formatUsage(usage: NonNullable<Usage>): string {
  return `${usage.percent}% 使用中 · ${(usage.usedBytes / 1024 / 1024).toFixed(1)} MB / ${(usage.limitBytes / 1024 / 1024).toFixed(0)} MB`;
}

export function StorageWarningBanner({ adminPath }: { adminPath: string }) {
  const [usage, setUsage] = useState<Usage>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/storage/usage")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.percent != null) setUsage(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (usage == null) return null;

  const safe = usage.percent < WARN_THRESHOLD;
  const critical = usage.percent >= CRITICAL_THRESHOLD;
  const label = safe
    ? "ストレージ使用量"
    : critical
      ? "ストレージが逼迫しています"
      : "ストレージ使用量が多くなっています";

  return (
    <div
      className={
        safe
          ? "flex items-center justify-between gap-4 border-b border-border bg-muted/30 px-4 py-2 text-muted-foreground"
          : critical
            ? "flex items-center justify-between gap-4 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-destructive"
            : "flex items-center justify-between gap-4 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-amber-800 dark:text-amber-200"
      }
    >
      <div className="flex items-center gap-2">
        {safe ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0" />
        )}
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm opacity-90">{formatUsage(usage)}</span>
      </div>
      <Link
        href={`/${adminPath}/storage`}
        className="flex items-center gap-1 rounded px-2 py-1 text-sm font-medium opacity-90 hover:opacity-100"
      >
        <HardDrive className="h-4 w-4" />
        ストレージ整理
      </Link>
    </div>
  );
}
