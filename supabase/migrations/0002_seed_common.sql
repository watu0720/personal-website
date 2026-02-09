-- 共通seed（開発・本番で共通して入れるデータ）
-- admin_roles は含めない（本番でUIDが異なるため、運用手順で追加すること）

INSERT INTO public.page_contents (page_key, title, body_md, body_html)
VALUES
  ('home', '', '', ''),
  ('profile', '', '', ''),
  ('youtube', '', '', ''),
  ('niconico', '', '', ''),
  ('dev', '', '', '')
ON CONFLICT (page_key) DO NOTHING;
