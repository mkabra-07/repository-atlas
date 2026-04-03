import { describe, expect, it } from "vitest";

import { categorizePath, detectFrameworks, isImportantPath } from "@/lib/analysis/classify";

describe("repository classification helpers", () => {
  it("marks important files and categories", () => {
    expect(isImportantPath("package.json")).toBe(true);
    expect(categorizePath("src/components/button.tsx")).toBe("code");
    expect(categorizePath(".github/workflows/ci.yml")).toBe("infra");
    expect(categorizePath("docs/architecture.md")).toBe("docs");
  });

  it("detects framework hints from common config files", () => {
    expect(detectFrameworks(["package.json", "next.config.ts", "Dockerfile"])).toEqual([
      "Next.js",
      "Node.js",
      "Containerized deployment",
    ]);
  });
});

