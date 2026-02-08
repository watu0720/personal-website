"use client";

import { useState, useMemo } from "react";
import type { RepoItem } from "@/lib/services/github";

function formatDate(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

type SortKey = "updated" | "stars" | "name";

type Props = { items: RepoItem[]; error?: string };

export function DevReposSection({ items: initialItems, error }: Props) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");

  const filtered = useMemo(() => {
    if (!search.trim()) return initialItems;
    const q = search.trim().toLowerCase();
    return initialItems.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q) ||
        r.fullName.toLowerCase().includes(q)
    );
  }, [initialItems, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === "updated") arr.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
    else if (sort === "stars") arr.sort((a, b) => b.stargazersCount - a.stargazersCount);
    else if (sort === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [filtered, sort]);

  if (error && initialItems.length === 0) {
    return (
      <section className="mb-10">
        <p className="text-muted-foreground">{error}</p>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <input
          type="search"
          placeholder="リポジトリ名・説明で検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-lg border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="updated">更新日（新しい順）</option>
          <option value="stars">Star 数（多い順）</option>
          <option value="name">名前（昇順）</option>
        </select>
      </div>
      {error && initialItems.length > 0 && (
        <p className="mb-2 text-sm text-muted-foreground">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((r) => (
          <a
            key={r.fullName}
            href={r.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
          >
            <span className="font-semibold text-foreground">{r.name}</span>
            {r.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {r.language && <span>{r.language}</span>}
              <span>★ {r.stargazersCount}</span>
              <span>Fork {r.forksCount}</span>
              <span>{formatDate(r.updatedAt)}</span>
            </div>
            {r.topics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {r.topics.slice(0, 5).map((t) => (
                  <span
                    key={t}
                    className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
