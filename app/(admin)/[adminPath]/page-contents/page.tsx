import { AdminPageContentsForm } from "./components/admin-page-contents-form";

export default function AdminPageContentsPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-lg font-bold text-foreground md:mb-6 md:text-xl">ページ編集</h1>
      <AdminPageContentsForm />
    </div>
  );
}
