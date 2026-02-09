import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const BUCKET = "public-assets";

const BodySchema = z.object({
  deleteOrphans: z.array(z.string().min(1)).optional(),
  deleteAuditLogsBefore: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
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

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { deleteOrphans, deleteAuditLogsBefore } = parsed.data;

  const admin = createServiceRoleClient();
  const results: { orphansDeleted: number; auditLogsDeleted: number; errors: string[] } = {
    orphansDeleted: 0,
    auditLogsDeleted: 0,
    errors: [],
  };

  if (deleteOrphans && deleteOrphans.length > 0) {
    for (const path of deleteOrphans) {
      const { error } = await admin.storage.from(BUCKET).remove([path]);
      if (error) {
        results.errors.push(`Storage ${path}: ${error.message}`);
      } else {
        results.orphansDeleted += 1;
      }
    }
  }

  if (deleteAuditLogsBefore) {
    const { data: deleted, error } = await admin
      .from("audit_logs")
      .delete()
      .lt("created_at", deleteAuditLogsBefore)
      .select("id");
    if (error) {
      results.errors.push(`Audit logs: ${error.message}`);
    } else {
      results.auditLogsDeleted = deleted?.length ?? 0;
    }
  }

  return NextResponse.json(results);
}
