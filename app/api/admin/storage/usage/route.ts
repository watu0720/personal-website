import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/** Supabase free tier storage limit: 1GB */
const DEFAULT_LIMIT_BYTES = 1024 * 1024 * 1024;

type FileEntry = { name: string; id?: string; metadata?: { size?: number } };

async function listAllSizes(
  admin: ReturnType<typeof createServiceRoleClient>,
  bucket: string,
  prefix: string
): Promise<number> {
  const { data: list, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) return 0;
  let total = 0;
  for (const item of (list ?? []) as FileEntry[]) {
    const size = Number(item.metadata?.size);
    if (typeof size === "number" && size > 0) {
      total += size;
    } else {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      total += await listAllSizes(admin, bucket, fullPath);
    }
  }
  return total;
}

export async function GET() {
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

  try {
    const admin = createServiceRoleClient();
    const bucket = "public-assets";
    const usedBytes = await listAllSizes(admin, bucket, "");
    const limitBytes = DEFAULT_LIMIT_BYTES;
    const percent = limitBytes > 0 ? Math.round((usedBytes / limitBytes) * 100) : 0;

    return NextResponse.json({
      usedBytes,
      limitBytes,
      percent,
    });
  } catch (e) {
    console.error("GET /api/admin/storage/usage:", e);
    return NextResponse.json(
      { usedBytes: 0, limitBytes: DEFAULT_LIMIT_BYTES, percent: 0 },
      { status: 200 }
    );
  }
}
