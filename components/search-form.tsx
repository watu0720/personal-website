"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  initialQ: string;
  initialMode: string;
  initialTypes: string;
};

export function SearchForm({ initialQ, initialMode, initialTypes }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [mode, setMode] = useState(initialMode);
  const typesParam = searchParams.get("types") ?? initialTypes;

  // URLパラメータが変わったら検索欄を更新
  useEffect(() => {
    const qParam = searchParams.get("q") ?? "";
    const modeParam = searchParams.get("mode") === "word" ? "word" : "partial";
    setQ(qParam);
    setMode(modeParam);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedQ = q.trim();
    if (!trimmedQ) return;
    const params = new URLSearchParams();
    params.set("q", trimmedQ);
    params.set("mode", mode);
    if (typesParam !== "page,comment,youtube,niconico,github") {
      params.set("types", typesParam);
    }
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-col gap-3 rounded-lg border bg-card px-3 py-3 text-xs md:flex-row md:items-center md:px-3 md:py-2 md:text-sm"
    >
      {/* typesパラメータを維持 */}
      {typesParam !== "page,comment,youtube,niconico,github" && (
        <input type="hidden" name="types" value={typesParam} />
      )}
      <div className="flex flex-1 items-center gap-2">
        <label className="shrink-0 text-muted-foreground">検索語</label>
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="キーワードを入力"
          className="flex-1 rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary md:w-64 md:flex-none"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-muted-foreground md:gap-3">
        <span className="shrink-0">モード:</span>
        <label className="flex cursor-pointer items-center gap-1">
          <input
            type="radio"
            name="mode"
            value="partial"
            checked={mode === "partial"}
            onChange={() => setMode("partial")}
            className="rounded-full border-input"
          />
          部分一致
        </label>
        <label className="flex cursor-pointer items-center gap-1">
          <input
            type="radio"
            name="mode"
            value="word"
            checked={mode === "word"}
            onChange={() => setMode("word")}
            className="rounded-full border-input"
          />
          単語完全一致
        </label>
      </div>
      <button
        type="submit"
        disabled={!q.trim()}
        className="btn-motion w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed md:w-auto"
      >
        検索
      </button>
    </form>
  );
}
