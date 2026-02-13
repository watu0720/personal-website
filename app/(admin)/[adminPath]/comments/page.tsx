import { AdminCommentsList } from "./components/admin-comments-list";

export default function AdminCommentsPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-lg font-bold text-foreground md:mb-6 md:text-xl">コメント管理</h1>
      <AdminCommentsList />
    </div>
  );
}
