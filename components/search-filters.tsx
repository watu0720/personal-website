"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

type Props = {
  initialTypes: string;
  q: string;
  mode: string;
};

export function SearchFilters({ initialTypes, q, mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typesArray = initialTypes.split(",").map((t) => t.trim()).filter(Boolean);
  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(new Set(typesArray));

  useEffect(() => {
    const typesArray = initialTypes.split(",").map((t) => t.trim()).filter(Boolean);
    setEnabledTypes(new Set(typesArray));
  }, [initialTypes]);

  const toggleType = (type: string) => {
    const next = new Set(enabledTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    setEnabledTypes(next);

    // URLを更新
    const params = new URLSearchParams(searchParams.toString());
    if (next.size === 5) {
      // 全選択の場合はtypesパラメータを削除
      params.delete("types");
    } else {
      params.set("types", Array.from(next).join(","));
    }
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="mb-4 rounded-lg border bg-card p-3 text-xs md:text-sm">
      <div className="mb-2 font-medium text-foreground">検索対象:</div>
      <div className="flex flex-wrap gap-2 md:gap-3">
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={enabledTypes.has("page")}
            onChange={() => toggleType("page")}
            className="rounded border-input"
          />
          <span className="text-muted-foreground">ページ</span>
        </label>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={enabledTypes.has("comment")}
            onChange={() => toggleType("comment")}
            className="rounded border-input"
          />
          <span className="text-muted-foreground">コメント</span>
        </label>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={enabledTypes.has("youtube")}
            onChange={() => toggleType("youtube")}
            className="rounded border-input"
          />
          <span className="text-muted-foreground">YouTube</span>
        </label>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={enabledTypes.has("niconico")}
            onChange={() => toggleType("niconico")}
            className="rounded border-input"
          />
          <span className="text-muted-foreground">ニコニコ</span>
        </label>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={enabledTypes.has("github")}
            onChange={() => toggleType("github")}
            className="rounded border-input"
          />
          <span className="text-muted-foreground">GitHub</span>
        </label>
      </div>
    </div>
  );
}
