import { AdminImagesForm } from "./components/admin-images-form";

export default function AdminImagesPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-lg font-bold text-foreground md:mb-6 md:text-xl">画像管理</h1>
      <AdminImagesForm />
    </div>
  );
}
