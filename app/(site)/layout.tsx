import { PageShell } from "@/components/page-shell";
import { VisitTracker } from "@/components/visit-tracker";
import { getPageContent } from "@/lib/repositories/page-contents";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const homeContent = await getPageContent("home").catch(() => null);
  const headerImageUrl = homeContent?.header_image_url ?? null;

  return (
    <PageShell headerImageUrl={headerImageUrl}>
      <VisitTracker />
      {children}
    </PageShell>
  );
}
