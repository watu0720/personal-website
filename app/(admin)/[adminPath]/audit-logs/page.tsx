import { AdminAuditLogsList } from "./components/admin-audit-logs-list";

export default function AdminAuditLogsPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-lg font-bold text-foreground md:mb-6 md:text-xl">操作ログ</h1>
      <AdminAuditLogsList />
    </div>
  );
}
