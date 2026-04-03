const IMPORTANT_FILES = [
  "package.json",
  "requirements.txt",
  "pyproject.toml",
  "tsconfig.json",
  "Dockerfile",
  "README.md",
  ".github/workflows",
];

export function categorizePath(path: string) {
  const lower = path.toLowerCase();

  if (
    lower.includes("/dist/") ||
    lower.includes("/build/") ||
    lower.includes("/coverage/") ||
    lower.includes("/vendor/") ||
    lower.includes("/node_modules/")
  ) {
    return "generated" as const;
  }

  if (lower.startsWith(".github/") || lower.includes("docker") || lower.includes("terraform")) {
    return "infra" as const;
  }

  if (lower.includes("readme") || lower.startsWith("docs/")) {
    return "docs" as const;
  }

  if (lower.includes("test") || lower.includes("spec")) {
    return "test" as const;
  }

  if (
    lower.endsWith(".json") ||
    lower.endsWith(".toml") ||
    lower.endsWith(".yaml") ||
    lower.endsWith(".yml") ||
    lower.endsWith(".ini") ||
    lower.endsWith(".env")
  ) {
    return "config" as const;
  }

  if (lower.startsWith("scripts/")) {
    return "scripts" as const;
  }

  if (
    lower.endsWith(".js") ||
    lower.endsWith(".jsx") ||
    lower.endsWith(".ts") ||
    lower.endsWith(".tsx") ||
    lower.endsWith(".py")
  ) {
    return "code" as const;
  }

  return "other" as const;
}

export function isImportantPath(path: string) {
  return IMPORTANT_FILES.some((important) => path === important || path.startsWith(`${important}/`));
}

export function detectFrameworks(filePaths: string[]) {
  const set = new Set<string>();
  const joined = filePaths.join("\n").toLowerCase();

  if (joined.includes("next.config")) {
    set.add("Next.js");
  }
  if (joined.includes("vite.config")) {
    set.add("Vite");
  }
  if (joined.includes("nuxt")) {
    set.add("Nuxt");
  }
  if (joined.includes("manage.py") || joined.includes("pyproject.toml")) {
    set.add("Python application");
  }
  if (joined.includes("package.json")) {
    set.add("Node.js");
  }
  if (joined.includes("dockerfile")) {
    set.add("Containerized deployment");
  }

  return Array.from(set);
}

