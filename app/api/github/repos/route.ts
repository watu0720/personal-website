import { NextResponse } from "next/server";
import { getGitHubRepos } from "@/lib/services/github";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

export async function GET() {
  const data = await getGitHubRepos();
  return NextResponse.json(data);
}
