"use client";

import { useEffect, useState } from "react";

type Stats = { pv: number; unique: number };
type PageRankItem = { page_key: string; pv: number; unique: number };
type Data = {
  today: Stats;
  yesterday: Stats;
  last7: Stats;
  last30: Stats;
  pageRankingPv: PageRankItem[];
  pageRankingUnique: PageRankItem[];
};

const PAGE_LABELS: Record<string, string> = {
  home: "ホーム",
  profile: "プロフィール",
  youtube: "YouTube",
  niconico: "ニコニコ",
  dev: "個人開発",
};

function label(key: string): string {
  return PAGE_LABELS[key] ?? key;
}

export function AdminStatsContent() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to fetch"))))
      .then(setData)
      .catch(() => setError("取得できませんでした"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-muted-foreground">読み込み中…</p>;
  }

  if (error || !data) {
    return <p className="text-muted-foreground">{error ?? "データがありません"}</p>;
  }

  return (
    <>
      <section className="mb-6 md:mb-8">
        <h2 className="mb-3 text-base font-semibold text-foreground md:mb-4 md:text-lg">サマリー</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
          <div className="rounded-xl border bg-card p-3 md:p-4">
            <p className="text-xs text-muted-foreground md:text-sm">今日</p>
            <p className="mt-1 text-xl font-bold text-foreground md:text-2xl">PV {data.today.pv}</p>
            <p className="text-xs text-muted-foreground md:text-sm">ユニーク {data.today.unique}</p>
          </div>
          <div className="rounded-xl border bg-card p-3 md:p-4">
            <p className="text-xs text-muted-foreground md:text-sm">昨日</p>
            <p className="mt-1 text-xl font-bold text-foreground md:text-2xl">PV {data.yesterday.pv}</p>
            <p className="text-xs text-muted-foreground md:text-sm">ユニーク {data.yesterday.unique}</p>
          </div>
          <div className="rounded-xl border bg-card p-3 md:p-4">
            <p className="text-xs text-muted-foreground md:text-sm">直近7日</p>
            <p className="mt-1 text-xl font-bold text-foreground md:text-2xl">PV {data.last7.pv}</p>
            <p className="text-xs text-muted-foreground md:text-sm">ユニーク {data.last7.unique}</p>
          </div>
          <div className="rounded-xl border bg-card p-3 md:p-4">
            <p className="text-xs text-muted-foreground md:text-sm">直近30日</p>
            <p className="mt-1 text-xl font-bold text-foreground md:text-2xl">PV {data.last30.pv}</p>
            <p className="text-xs text-muted-foreground md:text-sm">ユニーク {data.last30.unique}</p>
          </div>
        </div>
      </section>

      <section className="mb-6 md:mb-8">
        <h2 className="mb-3 text-base font-semibold text-foreground md:mb-4 md:text-lg">ページ別 PV ランキング</h2>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-2 py-2 text-left font-medium text-foreground md:px-4">順位</th>
                <th className="px-2 py-2 text-left font-medium text-foreground md:px-4">ページ</th>
                <th className="px-2 py-2 text-right font-medium text-foreground md:px-4">PV</th>
                <th className="px-2 py-2 text-right font-medium text-foreground md:px-4">ユニーク</th>
              </tr>
            </thead>
            <tbody>
              {data.pageRankingPv.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-center text-muted-foreground md:px-4 md:py-6">
                    データがありません
                  </td>
                </tr>
              ) : (
                data.pageRankingPv.map((row, i) => (
                  <tr key={row.page_key} className="border-b last:border-0">
                    <td className="px-2 py-2 text-muted-foreground md:px-4">{i + 1}</td>
                    <td className="px-2 py-2 font-medium text-foreground md:px-4">{label(row.page_key)}</td>
                    <td className="px-2 py-2 text-right text-foreground md:px-4">{row.pv}</td>
                    <td className="px-2 py-2 text-right text-foreground md:px-4">{row.unique}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-foreground md:mb-4 md:text-lg">ページ別 ユニーク ランキング</h2>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-2 py-2 text-left font-medium text-foreground md:px-4">順位</th>
                <th className="px-2 py-2 text-left font-medium text-foreground md:px-4">ページ</th>
                <th className="px-2 py-2 text-right font-medium text-foreground md:px-4">PV</th>
                <th className="px-2 py-2 text-right font-medium text-foreground md:px-4">ユニーク</th>
              </tr>
            </thead>
            <tbody>
              {data.pageRankingUnique.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-center text-muted-foreground md:px-4 md:py-6">
                    データがありません
                  </td>
                </tr>
              ) : (
                data.pageRankingUnique.map((row, i) => (
                  <tr key={row.page_key} className="border-b last:border-0">
                    <td className="px-2 py-2 text-muted-foreground md:px-4">{i + 1}</td>
                    <td className="px-2 py-2 font-medium text-foreground md:px-4">{label(row.page_key)}</td>
                    <td className="px-2 py-2 text-right text-foreground md:px-4">{row.pv}</td>
                    <td className="px-2 py-2 text-right text-foreground md:px-4">{row.unique}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
