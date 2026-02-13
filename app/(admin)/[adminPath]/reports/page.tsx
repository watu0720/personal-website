import { AdminReportsList } from "./components/admin-reports-list";

export default function AdminReportsPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-lg font-bold text-foreground md:mb-6 md:text-xl">通報管理</h1>
      <AdminReportsList />
    </div>
  );
}
