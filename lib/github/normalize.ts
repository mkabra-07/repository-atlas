import { z } from "zod";

import type { RepoCoordinates } from "@/lib/types";

const githubUrlSchema = z.url().refine((value) => value.includes("github.com"), {
  message: "Only GitHub repository URLs are supported.",
});

export function normalizeGithubRepoUrl(input: string): RepoCoordinates & {
  canonicalUrl: string;
  fullName: string;
} {
  const parsedUrl = githubUrlSchema.parse(input.trim());
  const url = new URL(parsedUrl);
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length < 2) {
    throw new Error("A GitHub repository URL must include both owner and repository name.");
  }

  const owner = segments[0];
  const name = segments[1].replace(/\.git$/, "");

  return {
    owner,
    name,
    fullName: `${owner}/${name}`,
    canonicalUrl: `https://github.com/${owner}/${name}`,
  };
}

export function buildGithubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "github-repository-analyzer",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

