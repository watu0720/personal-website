import { AdminApiKeysContent } from "./components/admin-api-keys-content";

export default function AdminApiKeysPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-lg font-bold text-foreground md:mb-6 md:text-xl">APIキー管理</h1>
      <AdminApiKeysContent />
    </div>
  );
}
