import { createServiceRoleClient } from "@/lib/supabase/admin";

export type LinkPreview = {
  url: string;
  provider: string | null;
  title: string | null;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
  ok: boolean;
  error_text: string | null;
};

const PROVIDER_PATTERNS: Array<{ provider: string; pattern: RegExp }> = [
  { provider: "youtube", pattern: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i },
  { provider: "niconico", pattern: /^https?:\/\/(www\.)?nicovideo\.jp/i },
  { provider: "twitter", pattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)/i },
  { provider: "github", pattern: /^https?:\/\/(www\.)?github\.com/i },
];

function detectProvider(url: string): string | null {
  for (const { provider, pattern } of PROVIDER_PATTERNS) {
    if (pattern.test(url)) {
      return provider;
    }
  }
  return null;
}

async function fetchOGP(url: string): Promise<Partial<LinkPreview>> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const html = await response.text();
    const og: Partial<LinkPreview> = {
      title: null,
      description: null,
      image_url: null,
      site_name: null,
    };

    // 簡易的なOGP抽出（正規表現ベース）
    const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (titleMatch) og.title = titleMatch[1];

    const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if (descMatch) og.description = descMatch[1];

    const imageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (imageMatch) og.image_url = imageMatch[1];

    const siteMatch = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
    if (siteMatch) og.site_name = siteMatch[1];

    // タイトルが無い場合は<title>タグから取得
    if (!og.title) {
      const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleTagMatch) og.title = titleTagMatch[1].trim();
    }

    return og;
  } catch (error) {
    return {
      title: null,
      description: null,
      image_url: null,
      site_name: null,
      error_text: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getLinkPreview(url: string): Promise<LinkPreview> {
  const admin = createServiceRoleClient();

  // キャッシュを確認
  const { data: cached } = await admin
    .from("link_previews")
    .select("*")
    .eq("url", url)
    .single();

  if (cached) {
    const now = new Date();
    const fetchedAt = new Date(cached.fetched_at);
    const ageSeconds = (now.getTime() - fetchedAt.getTime()) / 1000;

    // TTL内ならキャッシュを返す
    if (ageSeconds < cached.ttl_seconds && cached.ok) {
      return {
        url: cached.url,
        provider: cached.provider,
        title: cached.title,
        description: cached.description,
        image_url: cached.image_url,
        site_name: cached.site_name,
        ok: cached.ok,
        error_text: cached.error_text,
      };
    }
  }

  // キャッシュが無効または無い場合は取得
  const provider = detectProvider(url);
  let preview: Partial<LinkPreview> = {
    provider,
    title: null,
    description: null,
    image_url: null,
    site_name: null,
    ok: false,
    error_text: null,
  };

  try {
    const ogp = await fetchOGP(url);
    preview = {
      ...preview,
      ...ogp,
      ok: true,
    };
  } catch (error) {
    preview.error_text = error instanceof Error ? error.message : "Unknown error";
    preview.ok = false;
  }

  // キャッシュに保存
  const ttlSeconds = preview.ok ? 86400 : 600; // 成功: 24時間、失敗: 10分
  await admin
    .from("link_previews")
    .upsert(
      {
        url,
        provider: preview.provider,
        title: preview.title,
        description: preview.description,
        image_url: preview.image_url,
        site_name: preview.site_name,
        fetched_at: new Date().toISOString(),
        ttl_seconds: ttlSeconds,
        ok: preview.ok,
        error_text: preview.error_text,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "url" }
    );

  return {
    url,
    provider: preview.provider || null,
    title: preview.title || null,
    description: preview.description || null,
    image_url: preview.image_url || null,
    site_name: preview.site_name || null,
    ok: preview.ok,
    error_text: preview.error_text || null,
  };
}

export function extractLinksFromHtml(html: string): string[] {
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
  const links: string[] = [];
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      links.push(url);
    }
  }
  return [...new Set(links)]; // 重複除去
}
