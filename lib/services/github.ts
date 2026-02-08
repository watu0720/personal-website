/**
 * Server only. GitHub API. Use from API routes or Server Components.
 */

import { unstable_cache } from "next/cache";

export type RepoItem = {
  name: string;
  fullName: string;
  htmlUrl: string;
  description?: string;
  language?: string;
  topics: string[];
  stargazersCount: number;
  forksCount: number;
  updatedAt: string;
  homepage?: string;
};

export type GitHubReposResponse = {
  items: RepoItem[];
  error?: string;
};

function getUsername(): string {
  const u = process.env.GITHUB_USERNAME;
  if (!u) throw new Error("GITHUB_USERNAME is not set");
  return u.trim();
}

function getToken(): string | undefined {
  return process.env.GITHUB_TOKEN?.trim();
}

type GhRepo = {
  name?: string;
  full_name?: string;
  html_url?: string;
  description?: string | null;
  language?: string | null;
  topics?: string[];
  stargazers_count?: number;
  forks_count?: number;
  updated_at?: string;
  homepage?: string | null;
  fork?: boolean;
  archived?: boolean;
  private?: boolean;
};

async function fetchReposUncached(): Promise<RepoItem[]> {
  const username = getUsername();
  const token = getToken();
  const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&direction=desc&per_page=100`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers, next: { revalidate: 1800 } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${text}`);
  }
  const data = (await res.json()) as GhRepo[];
  const items: RepoItem[] = [];
  for (const r of Array.isArray(data) ? data : []) {
    if (r.fork || r.archived || r.private) continue;
    items.push({
      name: r.name ?? "",
      fullName: r.full_name ?? r.name ?? "",
      htmlUrl: r.html_url ?? "",
      description: r.description ?? undefined,
      language: r.language ?? undefined,
      topics: Array.isArray(r.topics) ? r.topics : [],
      stargazersCount: r.stargazers_count ?? 0,
      forksCount: r.forks_count ?? 0,
      updatedAt: r.updated_at ?? "",
      homepage: r.homepage ?? undefined,
    });
  }
  return items;
}

export async function getGitHubRepos(): Promise<GitHubReposResponse> {
  try {
    const items = await unstable_cache(fetchReposUncached, ["github-repos"], {
      revalidate: 1800,
    })();
    return { items };
  } catch (e) {
    console.error("getGitHubRepos:", e);
    return { items: [], error: "取得できませんでした" };
  }
}
