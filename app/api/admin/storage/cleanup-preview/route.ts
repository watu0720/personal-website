import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const BUCKETS = ["public-assets"] as const; // newsはpublic-assetsバケット内のフォルダ
/** Match .../public-assets/PATH or .../public-assets/PATH?query */
// より柔軟なマッチング: クエリパラメータや特殊文字も含む
const PUBLIC_ASSETS_PATH_RE = /\/public-assets\/([^"'<>\s]+?)(?:\?|"|'|>|\s|$)/;

function extractPathsFromUrl(url: string | null): string[] {
  if (!url || typeof url !== "string") return [];
  // public-assetsバケットのURLを検出（newsフォルダも含む）
  // URL形式: https://xxx.supabase.co/storage/v1/object/public/public-assets/PATH?v=timestamp
  // または: https://xxx.supabase.co/storage/v1/object/public/public-assets/news/xxx/yyy.jpg?v=timestamp
  const m = url.match(PUBLIC_ASSETS_PATH_RE);
  if (!m) {
    // デバッグ用: マッチしなかったURLをログ出力
    if (url.includes("public-assets")) {
      console.log(`[Storage Cleanup] Failed to extract path from URL: "${url}"`);
    }
    return [];
  }
  let path = m[1].replace(/\/$/, "");
  // クエリパラメータを除去（?v=timestampなど）
  path = path.split("?")[0];
  // パスを正規化（先頭のスラッシュを除去）
  path = path.replace(/^\/+/, "");
  if (path && path.includes("news/")) {
    console.log(`[Storage Cleanup] Extracted path from URL: "${path}" (from: "${url}")`);
  }
  return path ? [path] : [];
}

function extractPathsFromHtml(html: string | null): string[] {
  if (!html) return [];
  const paths: string[] = [];
  const seen = new Set<string>(); // 重複を避けるためのSet
  // public-assets のパスを抽出（完全なURL形式または相対パス形式）
  // 例: https://xxx.supabase.co/storage/v1/object/public/public-assets/PATH
  // または: <img src="/public-assets/PATH" />
  // または: <img src="https://xxx.supabase.co/storage/v1/object/public/public-assets/news/xxx/yyy.jpg?v=timestamp" />
  // より柔軟なマッチング: クエリパラメータや特殊文字も含む
  const publicAssetsRe = /\/public-assets\/([^"'<>\s]+?)(?:\?|"|'|>|\s|$)/g;
  let m: RegExpExecArray | null;
  while ((m = publicAssetsRe.exec(html)) !== null) {
    let path = m[1].replace(/\/$/, "");
    // クエリパラメータを除去
    path = path.split("?")[0];
    // パスを正規化（先頭のスラッシュを除去）
    path = path.replace(/^\/+/, "");
    if (path) {
      const fullPath = `public-assets:${path}`;
      // 重複を避ける
      if (!seen.has(fullPath)) {
        paths.push(fullPath);
        seen.add(fullPath);
      }
    }
  }
  return paths;
}

type FileEntry = { name: string; id?: string; metadata?: { size?: number } };

async function listAllPaths(
  admin: ReturnType<typeof createServiceRoleClient>,
  bucket: string,
  prefix: string
): Promise<string[]> {
  const { data: list, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });
  if (error) {
    console.error(`Error listing paths for prefix "${prefix}":`, error);
    return [];
  }
  const result: string[] = [];
  for (const item of (list ?? []) as FileEntry[]) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    const size = Number(item.metadata?.size ?? 0);
    // ファイルの場合（size > 0）またはメタデータがない場合（フォルダの可能性があるが、再帰的に確認）
    if (size > 0) {
      // ファイルとして追加
      result.push(`${bucket}:${fullPath}`);
    } else {
      // フォルダの可能性があるので、再帰的にリストアップ
      // ただし、空のフォルダは無視される
      const subPaths = await listAllPaths(admin, bucket, fullPath);
      result.push(...subPaths);
    }
  }
  return result;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await supabase
    .from("admin_roles")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();
  if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const auditBefore = req.nextUrl.searchParams.get("auditBefore"); // ISO date string

  try {
    const admin = createServiceRoleClient();
    const referenced = new Set<string>();

    // プロフィール画像を参照として追加
    // avatar_pathは "avatars/profile.jpg" のような形式で保存されている
    const { data: profiles } = await admin.from("profiles").select("avatar_path");
    for (const row of profiles ?? []) {
      const path = (row as { avatar_path: string | null }).avatar_path;
      if (path) {
        // public-assetsバケット内のパスとして追加
        referenced.add(`public-assets:${path}`);
      }
    }

    // ページコンテンツのヘッダー画像と本文内の画像を参照として追加
    const { data: pageContents } = await admin.from("page_contents").select("header_image_url, body_html");
    for (const row of pageContents ?? []) {
      const r = row as { header_image_url: string | null; body_html: string | null };
      // header_image_urlは完全なURLなので、extractPathsFromUrlでパスを抽出
      extractPathsFromUrl(r.header_image_url).forEach((p) => referenced.add(`public-assets:${p}`));
      // body_html内の画像パスを抽出
      extractPathsFromHtml(r.body_html).forEach((p) => referenced.add(p));
    }

    // お知らせの画像を参照として追加
    const { data: newsPosts } = await admin
      .from("news_posts")
      .select("thumbnail_url, body_html")
      .is("deleted_at", null);
    for (const row of newsPosts ?? []) {
      const r = row as { thumbnail_url: string | null; body_html: string | null };
      // thumbnail_urlは完全なURLなので、extractPathsFromUrlでパスを抽出
      const thumbnailPaths = extractPathsFromUrl(r.thumbnail_url);
      thumbnailPaths.forEach((p) => {
        const fullPath = `public-assets:${p}`;
        referenced.add(fullPath);
        if (fullPath.includes("news/")) {
          console.log(`[Storage Cleanup] Added referenced thumbnail path: "${fullPath}"`);
        }
      });
      // body_html内の画像パスを抽出（newsフォルダ内の画像も含む）
      const bodyPaths = extractPathsFromHtml(r.body_html);
      bodyPaths.forEach((p) => {
        referenced.add(p);
        if (p.includes("news/")) {
          console.log(`[Storage Cleanup] Added referenced body path: "${p}"`);
        }
      });
    }

    const { data: changelogRows } = await admin.from("site_changelog").select("body_html");
    if (changelogRows) {
      for (const row of changelogRows as { body_html: string | null }[]) {
        extractPathsFromHtml(row.body_html).forEach((p) => referenced.add(p));
      }
    }
    const { data: changelogLegacy } = await admin.from("changelog").select("body_html");
    if (changelogLegacy) {
      for (const row of changelogLegacy as { body_html: string | null }[]) {
        extractPathsFromHtml(row.body_html).forEach((p) => referenced.add(p));
      }
    }

    // public-assetsバケットからパスを取得（newsフォルダも含む）
    const allPaths: string[] = [];
    for (const bucket of BUCKETS) {
      const paths = await listAllPaths(admin, bucket, "");
      allPaths.push(...paths);
    }

    // デバッグ用: newsフォルダ内のパスを確認
    const newsPaths = allPaths.filter((p) => p.includes("news/"));
    console.log(`[Storage Cleanup] Found ${newsPaths.length} paths in news folder`);
    console.log(`[Storage Cleanup] All news paths:`, newsPaths);
    console.log(`[Storage Cleanup] Referenced paths count: ${referenced.size}`);
    const referencedNewsPaths = Array.from(referenced).filter((p) => p.includes("news/"));
    console.log(`[Storage Cleanup] Referenced news paths count: ${referencedNewsPaths.length}`);
    console.log(`[Storage Cleanup] Referenced news paths:`, referencedNewsPaths);

    // 直近7日以内にアップロードされた画像は除外（誤判定防止）
    // ただし、newsフォルダ内の画像は除外しない（実際に未参照であれば検出すべき）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const orphanPaths = allPaths.filter((p) => {
      if (!referenced.has(p)) {
        // newsフォルダ内の画像は7日以内でも検出する
        if (p.includes("news/")) {
          return true;
        }
        // その他のファイルは7日以内なら除外（誤判定防止）
        // 簡易実装: パスにタイムスタンプが含まれている場合は除外
        const timestampMatch = p.match(/\d{13}/); // 13桁のタイムスタンプ
        if (timestampMatch) {
          const timestamp = parseInt(timestampMatch[0], 10);
          const fileDate = new Date(timestamp);
          const isRecent = fileDate >= sevenDaysAgo;
          if (isRecent) {
            return false; // 7日以内なので除外
          }
        }
        return true;
      }
      return false;
    });

    // デバッグ用: newsフォルダ内の未参照パスを確認
    const orphanNewsPaths = orphanPaths.filter((p) => p.includes("news/"));
    console.log(`[Storage Cleanup] Orphan news paths count: ${orphanNewsPaths.length}`);
    if (orphanNewsPaths.length > 0) {
      console.log(`[Storage Cleanup] Orphan news paths:`, orphanNewsPaths);
    }
    // マッチング確認: 各newsパスが参照されているかチェック
    for (const newsPath of newsPaths) {
      const isReferenced = referenced.has(newsPath);
      if (!isReferenced) {
        console.log(`[Storage Cleanup] Unmatched news path: "${newsPath}"`);
        // 類似する参照パスを探す
        const similarRefs = Array.from(referenced).filter((ref) => ref.includes("news/"));
        console.log(`[Storage Cleanup] Similar referenced paths:`, similarRefs);
      }
    }

    let auditLogsCount = 0;
    if (auditBefore) {
      const { count, error: countError } = await admin
        .from("audit_logs")
        .select("*", { count: "exact", head: true })
        .lt("created_at", auditBefore);
      if (!countError && count != null) auditLogsCount = count;
    }

    return NextResponse.json({
      orphanPaths,
      auditLogsCount,
    });
  } catch (e) {
    console.error("GET /api/admin/storage/cleanup-preview:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Preview failed" },
      { status: 500 }
    );
  }
}
