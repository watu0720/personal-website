import { HardDrive } from "lucide-react";
import { AdminStorageContent } from "./components/admin-storage-content";

export default function AdminStoragePage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground md:mb-6 md:text-xl">
        <HardDrive className="h-4 w-4 md:h-5 md:w-5" />
        ストレージ整理
      </h1>
      <AdminStorageContent />
    </div>
  );
}
