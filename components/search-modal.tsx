"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearchSubmit = () => {
    const q = search.trim();
    if (!q) return;
    const params = new URLSearchParams({ q, mode: "partial" });
    // 現在のURLからtypesパラメータを取得して維持
    if (typeof window !== "undefined") {
      const currentParams = new URLSearchParams(window.location.search);
      const types = currentParams.get("types");
      if (types) {
        params.set("types", types);
      }
      try {
        const key = "recent_search_words";
        const raw = window.localStorage.getItem(key);
        const arr = raw ? ((JSON.parse(raw) as string[]) || []) : [];
        const filtered = Array.isArray(arr) ? arr.filter((w) => w !== q) : [];
        const next = [q, ...filtered].slice(0, 10);
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore
      }
    }
    router.push(`/search?${params.toString()}`);
    onClose();
    setSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm">
      <div className="mt-20 w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">サイト内検索</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="検索キーワードを入力"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <button
            onClick={handleSearchSubmit}
            disabled={!search.trim()}
            className="btn-motion shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="検索を実行"
            title="検索を実行"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}