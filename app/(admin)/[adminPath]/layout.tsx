import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { StorageWarningBanner } from "@/components/admin/storage-warning-banner";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ adminPath: string }>;
}) {
  const { adminPath } = await params;
  const secret = process.env.ADMIN_PATH_SECRET;
  if (!secret || adminPath !== secret) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AdminGate adminPath={adminPath} mode="login" />;
  }

  const { data: adminRow } = await supabase
    .from("admin_roles")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!adminRow) {
    return <AdminGate adminPath={adminPath} mode="forbidden" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StorageWarningBanner adminPath={adminPath} />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <AdminSidebar adminPath={adminPath} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
