import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGitHubRepos } from "@/lib/services/github";
import {
  getYouTubeUploads,
  getYouTubePlaylists,
  getYouTubeNotifications,
} from "@/lib/services/youtube";
import {
  getNiconicoUploads,
  getNiconicoMylists,
  getNiconicoNotifications,
} from "@/lib/services/niconico";

export const metadata: Metadata = {
  title: "サイト内検索 | わっつーのHP",
};

type SearchParams = {
  q?: string;
  mode?: string;
};

type PageHit = {
  type: "page";
  pageKey: string;
  title: string;
  snippet: string;
  href: string;
};

type CommentHit = {
  type: "comment";
  id: string;
  pageKey: string;
  snippet: string;
  href: string;
};

type VideoHit = {
  type: "video";
  service: "youtube" | "niconico";
  title: string;
  url: string;
  snippet: string;
};

type RepoHit = {
  type: "repo";
  name: string;
  url: string;
  snippet: string;
};

function normalize(str: string): string {
  return str.toLowerCase();
}

function makeSnippet(text: string, q: string, radius = 40): string {
  const lower = normalize(text);
  const lowerQ = normalize(q);
  const idx = lower.indexOf(lowerQ);
  if (idx === -1) {
    return text.slice(0, radius * 2) + (text.length > radius * 2 ? "…" : "");
  }
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + q.length + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return prefix + text.slice(start, end) + suffix;
}

const PAGE_PATHS: Record<string, string> = {
  home: "/",
  profile: "/profile",
  youtube: "/youtube",
  niconico: "/niconico",
  dev: "/dev",
};

export default async function SearchPage(props: any) {
  const { searchParams } = props as { searchParams: SearchParams };
  const q = (searchParams.q ?? "").trim();
  const mode = searchParams.mode === "word" ? "word" : "partial";

  if (!q) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-10">
        <h1 className="mb-4 text-xl font-bold text-foreground md:text-2xl">
          サイト内検索
        </h1>
        <p className="text-sm text-muted-foreground">
          ヘッダーの検索ボックスから、1文字以上入力して検索してください。
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  const pagesPromise = supabase
    .from("page_contents")
    .select("page_key, title, body_html")
    .then(({ data }) => (data ?? []) as { page_key: string; title: string; body_html: string }[]);

  const siteChangelogPromise = supabase
    .from("site_changelog")
    .select("id, title, body_html")
    .order("date", { ascending: false })
    .limit(50)
    .then(({ data }) => (data ?? []) as { id: string; title: string; body_html: string }[]);

  const commentsPromise = supabase
    .from("comments")
    .select("id, page_key, body, is_hidden, hidden_reason")
    .eq("is_hidden", false)
    .limit(500)
    .then(
      ({ data }) =>
        (data ?? []) as {
          id: string;
          page_key: string;
          body: string;
          is_hidden: boolean;
          hidden_reason: string | null;
        }[]
    );

  const githubPromise = getGitHubRepos();
  const ytUploadsPromise = getYouTubeUploads().catch(() => ({ items: [] }));
  const ytPlaylistsPromise = getYouTubePlaylists().catch(() => ({ items: [] }));
  const ytNotifyPromise = getYouTubeNotifications().catch(() => ({
    posts: [],
    playlistUpdates: [],
  }));
  const nicoUploadsPromise = getNiconicoUploads().catch(() => ({ items: [] }));
  const nicoMylistsPromise = getNiconicoMylists().catch(() => ({ items: [] }));
  const nicoNotifyPromise = getNiconicoNotifications().catch(() => ({
    posts: [],
    mylistUpdates: [],
  }));

  const [
    pages,
    changelog,
    comments,
    ghRepos,
    ytUploads,
    ytPlaylists,
    ytNotify,
    nicoUploads,
    nicoMylists,
    nicoNotify,
  ] = await Promise.all([
    pagesPromise,
    siteChangelogPromise,
    commentsPromise,
    githubPromise,
    ytUploadsPromise,
    ytPlaylistsPromise,
    ytNotifyPromise,
    nicoUploadsPromise,
    nicoMylistsPromise,
    nicoNotifyPromise,
  ]);

  const qNorm = normalize(q);

  const matchText = (text: string): boolean => {
    const t = normalize(text);
    if (!t) return false;
    if (mode === "partial") {
      return t.includes(qNorm);
    }
    // word mode: 簡易的に、英数字のみは単語境界、それ以外は部分一致
    const isAsciiWord = /^[A-Za-z0-9]+$/.test(q);
    if (isAsciiWord) {
      const regex = new RegExp(`\\b${qNorm.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
      return regex.test(text);
    }
    return t.includes(qNorm);
  };

  const pageHits: PageHit[] = [];
  for (const p of pages) {
    const haystack = `${p.title}\n${p.body_html ?? ""}`;
    if (!matchText(haystack)) continue;
    const snippet = makeSnippet(p.body_html ?? p.title, q);
    const hrefBase = PAGE_PATHS[p.page_key] ?? `/${p.page_key}`;
    const params = new URLSearchParams({ q, mode });
    pageHits.push({
      type: "page",
      pageKey: p.page_key,
      title: p.title || p.page_key,
      snippet,
      href: `${hrefBase}?${params.toString()}`,
    });
  }

  for (const c of changelog) {
    const haystack = `${c.title}\n${c.body_html ?? ""}`;
    if (!matchText(haystack)) continue;
    const snippet = makeSnippet(c.body_html ?? c.title, q);
    const params = new URLSearchParams({ q, mode });
    pageHits.push({
      type: "page",
      pageKey: "changelog",
      title: `改訂履歴: ${c.title}`,
      snippet,
      href: `/changelog?${params.toString()}`,
    });
  }

  const commentHits: CommentHit[] = [];
  for (const c of comments) {
    if (!matchText(c.body)) continue;
    const snippet = makeSnippet(c.body, q);
    commentHits.push({
      type: "comment",
      id: c.id,
      pageKey: c.page_key,
      snippet,
      href: "", // 後で埋める
    });
  }

  // コメントが対象ページの最新20件に含まれる場合は、通常ページ側を優先して遷移させる
  // そうでない場合はコメントログページへ。
  const pageKeysForComments = Array.from(new Set(commentHits.map((c) => c.pageKey)));
  const latestMap: Record<string, Set<string>> = {};
  for (const pk of pageKeysForComments) {
    const { data } = await supabase
      .from("comments")
      .select("id")
      .eq("page_key", pk)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(20);
    const set = new Set<string>();
    for (const row of (data ?? []) as { id: string }[]) {
      set.add(row.id);
    }
    latestMap[pk] = set;
  }

  for (const hit of commentHits) {
    const params = new URLSearchParams({ q, mode });
    const base = PAGE_PATHS[hit.pageKey];
    const inLatest = latestMap[hit.pageKey]?.has(hit.id) ?? false;
    if (base && inLatest) {
      hit.href = `${base}?${params.toString()}`;
    } else {
      hit.href = `/comments/${hit.pageKey}?${params.toString()}`;
    }
  }

  const videoHits: VideoHit[] = [];
  for (const v of ytUploads.items) {
    if (!matchText(v.title)) continue;
    videoHits.push({
      type: "video",
      service: "youtube",
      title: v.title,
      url: v.url,
      snippet: makeSnippet(v.title, q),
    });
  }
  for (const v of ytPlaylists.items) {
    if (!matchText(v.title)) continue;
    videoHits.push({
      type: "video",
      service: "youtube",
      title: v.title,
      url: v.url,
      snippet: makeSnippet(v.title, q),
    });
  }
  for (const n of ytNotify.posts) {
    if (!matchText(n.title)) continue;
    videoHits.push({
      type: "video",
      service: "youtube",
      title: n.title,
      url: n.url,
      snippet: makeSnippet(n.title, q),
    });
  }

  for (const v of nicoUploads.items) {
    if (!matchText(v.title)) continue;
    videoHits.push({
      type: "video",
      service: "niconico",
      title: v.title,
      url: v.url,
      snippet: makeSnippet(v.title, q),
    });
  }
  for (const m of nicoMylists.items) {
    if (!matchText(m.title)) continue;
    videoHits.push({
      type: "video",
      service: "niconico",
      title: m.title,
      url: m.url,
      snippet: makeSnippet(m.title, q),
    });
  }
  for (const n of nicoNotify.posts) {
    if (!matchText(n.title)) continue;
    videoHits.push({
      type: "video",
      service: "niconico",
      title: n.title,
      url: n.url,
      snippet: makeSnippet(n.title, q),
    });
  }

  const repoHits: RepoHit[] = [];
  for (const r of ghRepos.items) {
    const haystack = `${r.name}\n${r.description ?? ""}\n${r.htmlUrl}`;
    if (!matchText(haystack)) continue;
    const snippet = makeSnippet(r.description || r.fullName, q);
    repoHits.push({
      type: "repo",
      name: r.fullName,
      url: r.htmlUrl,
      snippet,
    });
  }

  const hasAny =
    pageHits.length > 0 ||
    commentHits.length > 0 ||
    videoHits.length > 0 ||
    repoHits.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10">
      <h1 className="mb-2 text-xl font-bold text-foreground md:text-2xl">
        サイト内検索
      </h1>
      <form
        action="/search"
        method="GET"
        className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border bg-card px-3 py-2 text-xs md:text-sm"
      >
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground">検索語</label>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="キーワードを入力"
            className="w-40 rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary md:w-64"
          />
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span>モード:</span>
          <label className="flex cursor-pointer items-center gap-1">
            <input
              type="radio"
              name="mode"
              value="partial"
              defaultChecked={mode === "partial"}
              className="rounded-full border-input"
            />
            部分一致
          </label>
          <label className="flex cursor-pointer items-center gap-1">
            <input
              type="radio"
              name="mode"
              value="word"
              defaultChecked={mode === "word"}
              className="rounded-full border-input"
            />
            単語完全一致
          </label>
        </div>
        <button
          type="submit"
          className="btn-motion rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          検索
        </button>
      </form>
      <p className="mb-4 text-xs text-muted-foreground md:text-sm">
        現在の検索語:「{q}」 / モード: {mode === "word" ? "単語完全一致" : "部分一致"}
      </p>

      {!hasAny && (
        <p className="text-sm text-muted-foreground">
          一致する結果は見つかりませんでした。
        </p>
      )}

      {pageHits.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">ページ</h2>
          <ul className="space-y-2">
            {pageHits.map((hit, i) => (
              <li key={`${hit.pageKey}-${i}`} className="rounded-lg border bg-card p-3">
                <Link
                  href={hit.href}
                  className="text-sm font-medium text-primary underline underline-offset-2"
                >
                  {hit.title}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                  {hit.snippet}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {commentHits.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">コメント</h2>
          <ul className="space-y-2">
            {commentHits.map((hit) => (
              <li key={hit.id} className="rounded-lg border bg-card p-3">
                <Link
                  href={hit.href}
                  className="text-xs font-medium text-primary underline underline-offset-2"
                >
                  コメントログへ（{hit.pageKey}）
                </Link>
                <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                  {hit.snippet}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {videoHits.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            動画（YouTube / ニコニコ）
          </h2>
          <ul className="space-y-2">
            {videoHits.map((hit, i) => (
              <li key={`${hit.service}-${hit.url}-${i}`} className="rounded-lg border bg-card p-3">
                <a
                  href={hit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary underline underline-offset-2"
                >
                  [{hit.service === "youtube" ? "YouTube" : "ニコニコ"}] {hit.title}
                </a>
                <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                  {hit.snippet}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {repoHits.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">GitHub</h2>
          <ul className="space-y-2">
            {repoHits.map((hit) => (
              <li key={hit.url} className="rounded-lg border bg-card p-3">
                <a
                  href={hit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary underline underline-offset-2"
                >
                  {hit.name}
                </a>
                <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                  {hit.snippet}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

