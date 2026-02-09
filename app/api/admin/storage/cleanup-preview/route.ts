import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const BUCKET = "public-assets";
/** Match .../public-assets/PATH or .../public-assets/PATH?query */
const PUBLIC_ASSETS_PATH_RE = /\/public-assets\/([^"'?\s]+)/;

function extractPathsFromUrl(url: string | null): string[] {
  if (!url || typeof url !== "string") return [];
  const m = url.match(PUBLIC_ASSETS_PATH_RE);
  if (!m) return [];
  const path = m[1].replace(/\/$/, "");
  return path ? [path] : [];
}

function extractPathsFromHtml(html: string | null): string[] {
  if (!html) return [];
  const re = /\/public-assets\/([^"'?\s]+)/g;
  const paths: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const path = m[1].replace(/\/$/, "");
    if (path) paths.push(path);
  }
  return paths;
}

type FileEntry = { name: string; id?: string; metadata?: { size?: number } };

async function listAllPaths(
  admin: ReturnType<typeof createServiceRoleClient>,
  prefix: string
): Promise<string[]> {
  const { data: list, error } = await admin.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) return [];
  const result: string[] = [];
  for (const item of (list ?? []) as FileEntry[]) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    const size = Number(item.metadata?.size);
    if (typeof size === "number" && size > 0) {
      result.push(fullPath);
    } else {
      result.push(...(await listAllPaths(admin, fullPath)));
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

    const { data: profiles } = await admin.from("profiles").select("avatar_path");
    for (const row of profiles ?? []) {
      const path = (row as { avatar_path: string | null }).avatar_path;
      if (path) referenced.add(path);
    }

    const { data: pageContents } = await admin.from("page_contents").select("header_image_url, body_html");
    for (const row of pageContents ?? []) {
      const r = row as { header_image_url: string | null; body_html: string | null };
      extractPathsFromUrl(r.header_image_url).forEach((p) => referenced.add(p));
      extractPathsFromHtml(r.body_html).forEach((p) => referenced.add(p));
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

    const allPaths = await listAllPaths(admin, "");
    const orphanPaths = allPaths.filter((p) => !referenced.has(p));

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
