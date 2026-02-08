import { createClient } from "@/lib/supabase/server";

export type MainProfile = {
  user_id: string;
  avatar_path: string | null;
  display_name: string | null;
  bio: string | null;
};

/**
 * Returns the "main" site profile (the one with avatar_path like avatars/profile.*).
 * Used for profile page display.
 */
export async function getMainProfile(): Promise<MainProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, avatar_path, display_name, bio")
    .like("avatar_path", "avatars/profile.%")
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as MainProfile;
}
