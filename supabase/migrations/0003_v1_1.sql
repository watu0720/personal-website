-- v1.1 差分: site_changelog の RLS ポリシー追加（baseline でテーブルはあるがポリシー未定義のため）
-- 公開: SELECT は全員可 / 更新・作成・削除: admin のみ

DROP POLICY IF EXISTS "site_changelog_select_public" ON "public"."site_changelog";
CREATE POLICY "site_changelog_select_public"
ON "public"."site_changelog"
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "site_changelog_admin_write" ON "public"."site_changelog";
CREATE POLICY "site_changelog_admin_write"
ON "public"."site_changelog"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid() AND ar.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid() AND ar.role = 'admin'
  )
);
