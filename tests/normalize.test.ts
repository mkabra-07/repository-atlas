import { describe, expect, it } from "vitest";

import { normalizeGithubRepoUrl } from "@/lib/github/normalize";

describe("normalizeGithubRepoUrl", () => {
  it("extracts owner and repository from a standard URL", () => {
    expect(normalizeGithubRepoUrl("https://github.com/vercel/next.js")).toMatchObject({
      owner: "vercel",
      name: "next.js",
      fullName: "vercel/next.js",
    });
  });

  it("rejects non-GitHub URLs", () => {
    expect(() => normalizeGithubRepoUrl("https://example.com/foo/bar")).toThrow();
  });
});

