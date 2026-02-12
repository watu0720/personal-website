import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await supabase
    .from("admin_roles")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();
  if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 環境変数の存在確認（値は返さない）
  const statuses = [
    {
      name: "YouTube API Key",
      envVar: "YOUTUBE_API_KEY",
      configured: !!process.env.YOUTUBE_API_KEY,
      description: "YouTube Data API v3の認証キー",
    },
    {
      name: "GitHub Token",
      envVar: "GITHUB_TOKEN",
      configured: !!process.env.GITHUB_TOKEN,
      description: "GitHub APIの認証トークン（オプション）",
    },
    {
      name: "YouTube Channel ID",
      envVar: "YOUTUBE_CHANNEL_ID",
      configured: !!process.env.YOUTUBE_CHANNEL_ID,
      description: "YouTubeチャンネルID",
    },
    {
      name: "Niconico User ID",
      envVar: "NICONICO_USER_ID",
      configured: !!process.env.NICONICO_USER_ID,
      description: "ニコニコ動画のユーザーID",
    },
  ];

  return NextResponse.json(statuses);
}
