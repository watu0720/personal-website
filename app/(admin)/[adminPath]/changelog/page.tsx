import { AdminChangelogContent } from "./components/admin-changelog-content";

export default function AdminChangelogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-10">
      <h1 className="mb-4 text-lg font-bold text-foreground md:mb-6 md:text-2xl">改訂履歴</h1>
      <AdminChangelogContent />
    </div>
  );
}
