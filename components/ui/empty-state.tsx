"use client";

import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  message?: string;
  className?: string;
};

export function EmptyState({ message = "データがありません", className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-lg border bg-card p-6", className)}>
      <Inbox className="mb-2 h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
