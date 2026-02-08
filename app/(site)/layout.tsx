import { PageShell } from "@/components/page-shell";
import { VisitTracker } from "@/components/visit-tracker";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageShell>
      <VisitTracker />
      {children}
    </PageShell>
  );
}
