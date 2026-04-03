import { buildGithubHeaders } from "@/lib/github/normalize";

export type GithubRepoMetadata = {
  owner: string;
  name: string;
  defaultBranch: string;
  description: string;
  stars: number;
  primaryLanguage?: string;
  pushedAt?: string;
};

export type GithubTreeEntry = {
  path: string;
  type: "blob" | "tree";
  size?: number;
  sha: string;
  url: string;
};

export async function fetchGithubRepo(owner: string, name: string): Promise<GithubRepoMetadata> {
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, {
    headers: buildGithubHeaders(),
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`GitHub repository lookup failed with ${response.status}.`);
  }

  const json = await response.json();
  return {
    owner,
    name,
    defaultBranch: json.default_branch,
    description: json.description ?? "",
    stars: json.stargazers_count ?? 0,
    primaryLanguage: json.language ?? undefined,
    pushedAt: json.pushed_at ?? undefined,
  };
}

export async function fetchGithubTree(owner: string, name: string, branch: string): Promise<{
  sha: string;
  tree: GithubTreeEntry[];
}> {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    {
      headers: buildGithubHeaders(),
      next: { revalidate: 0 },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub tree fetch failed with ${response.status}.`);
  }

  const json = await response.json();
  return {
    sha: json.sha,
    tree: (json.tree ?? []) as GithubTreeEntry[],
  };
}

export async function fetchFileContent(owner: string, name: string, path: string) {
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const response = await fetch(
    `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/HEAD/${encodedPath}`,
    {
      headers: buildGithubHeaders(),
      next: { revalidate: 0 },
    },
  );

  if (!response.ok) {
    return null;
  }

  return response.text();
}
