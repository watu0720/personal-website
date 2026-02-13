import { AdminStatsContent } from "./components/admin-stats-content";

export default function AdminStatsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-10">
      <h1 className="mb-4 text-lg font-bold text-foreground md:mb-6 md:text-2xl">訪問者統計</h1>
      <AdminStatsContent />
    </div>
  );
}
