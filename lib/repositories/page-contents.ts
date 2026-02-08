import { createClient } from "@/lib/supabase/server";

export type PageContent = {
  page_key: string;
  title: string;
  body_html: string | null;
  header_image_url: string | null;
  updated_at: string;
  updated_by: string | null;
};

export async function getPageContent(
  pageKey: string
): Promise<PageContent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("page_contents")
    .select("page_key, title, body_html, header_image_url, updated_at, updated_by")
    .eq("page_key", pageKey)
    .single();
  if (error || !data) return null;
  return data as PageContent;
}
