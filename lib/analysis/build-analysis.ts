import { randomUUID } from "node:crypto";

import { detectFrameworks, categorizePath, isImportantPath } from "@/lib/analysis/classify";
import { parseJavascriptImports, parsePythonImports } from "@/lib/analysis/imports";
import { fetchFileContent, fetchGithubRepo, fetchGithubTree } from "@/lib/github/api";
import type {
  AnalysisSnapshotRecord,
  GraphEdge,
  GraphNode,
  RepoInsight,
  RepoSummaries,
  TreeNode,
} from "@/lib/types";

const MAX_FILE_FETCH = 50;
const MAX_FILE_LEVEL_GRAPH = 120;
const SNAPSHOT_TTL_HOURS = 12;

function makeTree(paths: Array<{ path: string; type: "blob" | "tree" }>) {
  const root: TreeNode = {
    path: "",
    name: "root",
    type: "dir",
    children: [],
  };

  for (const entry of paths) {
    const segments = entry.path.split("/");
    let cursor = root;
    let builtPath = "";

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      builtPath = builtPath ? `${builtPath}/${segment}` : segment;
      const existing = cursor.children?.find((child) => child.name === segment);
      const isLeaf = index === segments.length - 1;
      const type = isLeaf && entry.type === "blob" ? "file" : "dir";

      if (existing) {
        cursor = existing;
        continue;
      }

      const node: TreeNode = {
        path: builtPath,
        name: segment,
        type,
        children: type === "dir" ? [] : undefined,
        category: categorizePath(builtPath),
        important: isImportantPath(builtPath),
      };

      cursor.children?.push(node);
      cursor = node;
    }
  }

  return root;
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function extension(path: string) {
  const parts = path.split(".");
  return parts.length > 1 ? parts.pop() ?? "" : "";
}

function toFolderNodeId(path: string) {
  return path || "root";
}

async function collectDependencyEdges(owner: string, name: string, filePaths: string[]) {
  const codeFiles = filePaths.filter((filePath) =>
    [".ts", ".tsx", ".js", ".jsx", ".py"].some((suffix) => filePath.endsWith(suffix)),
  );

  const selectedFiles = codeFiles.slice(0, MAX_FILE_FETCH);
  const edges: GraphEdge[] = [];
  const counts = new Map<string, number>();

  for (const filePath of selectedFiles) {
    const content = await fetchFileContent(owner, name, filePath);
    if (!content) {
      continue;
    }

    const imports = filePath.endsWith(".py")
      ? parsePythonImports(filePath, content)
      : parseJavascriptImports(filePath, content);

    for (const item of imports) {
      const target = filePaths.find(
        (candidate) =>
          candidate === item.target ||
          candidate.startsWith(`${item.target}.`) ||
          candidate.startsWith(`${item.target}/index.`),
      );

      if (!target) {
        continue;
      }

      edges.push({
        id: `${filePath}->${target}`,
        source: filePath,
        target,
        type: "imports",
      });

      counts.set(filePath, (counts.get(filePath) ?? 0) + 1);
      counts.set(target, (counts.get(target) ?? 0) + 1);
    }
  }

  return {
    edges,
    counts,
  };
}

function buildGraph(treePaths: string[], dependencyEdges: GraphEdge[]) {
  const fileLevel = treePaths.length <= MAX_FILE_LEVEL_GRAPH;
  const groupedCounts = new Map<string, number>();
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  if (fileLevel) {
    for (const filePath of treePaths) {
      groupedCounts.set(filePath, 0);
      nodes.push({
        id: filePath,
        label: filePath.split("/").pop() ?? filePath,
        path: filePath,
        kind: isImportantPath(filePath) ? "entry" : categorizePath(filePath) === "config" ? "config" : "file",
        fileType: extension(filePath),
      });
    }

    for (const edge of dependencyEdges) {
      edges.push(edge);
      groupedCounts.set(edge.source, (groupedCounts.get(edge.source) ?? 0) + 1);
      groupedCounts.set(edge.target, (groupedCounts.get(edge.target) ?? 0) + 1);
    }
  } else {
    const folders = unique(
      treePaths.map((item) => {
        const parts = item.split("/");
        return parts.length > 1 ? parts.slice(0, -1).join("/") : "root";
      }),
    );

    for (const folder of folders) {
      nodes.push({
        id: toFolderNodeId(folder),
        label: folder === "root" ? "root" : folder.split("/").pop() ?? folder,
        path: folder,
        kind: folder === "root" ? "entry" : "folder",
      });
      groupedCounts.set(toFolderNodeId(folder), 0);
    }

    const aggregated = new Map<string, GraphEdge>();
    for (const edge of dependencyEdges) {
      const sourceFolder = toFolderNodeId(edge.source.split("/").slice(0, -1).join("/") || "root");
      const targetFolder = toFolderNodeId(edge.target.split("/").slice(0, -1).join("/") || "root");

      if (sourceFolder === targetFolder) {
        continue;
      }

      const id = `${sourceFolder}->${targetFolder}`;
      aggregated.set(id, {
        id,
        source: sourceFolder,
        target: targetFolder,
        type: "imports",
      });
      groupedCounts.set(sourceFolder, (groupedCounts.get(sourceFolder) ?? 0) + 1);
      groupedCounts.set(targetFolder, (groupedCounts.get(targetFolder) ?? 0) + 1);
    }

    edges.push(...aggregated.values());
  }

  const hotspots = Array.from(groupedCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  for (const [path, count] of hotspots) {
    const node = nodes.find((item) => item.id === path);
    if (node) {
      node.kind = "hotspot";
      node.dependencyCount = count;
    }
  }

  return {
    granularity: fileLevel ? "file" : "folder",
    nodes,
    edges,
  } satisfies AnalysisSnapshotRecord["graph"];
}

function buildInsights(filePaths: string[], dependencyCounts: Map<string, number>): RepoInsight {
  const topAreas = unique(
    filePaths
      .map((path) => path.split("/")[0])
      .filter(Boolean),
  )
    .slice(0, 6)
    .map((segment) => ({
      path: segment,
      role: categorizePath(segment) === "docs" ? "Documentation" : "Primary workspace",
    }));

  const importantFiles = filePaths.filter((item) => isImportantPath(item)).slice(0, 12);
  const hotspots = Array.from(dependencyCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, count]) => ({ path, count }));

  return {
    projectType: filePaths.some((path) => path.endsWith("package.json"))
      ? "JavaScript/TypeScript application"
      : filePaths.some((path) => path.endsWith("pyproject.toml") || path.endsWith("requirements.txt"))
        ? "Python application"
        : "General software repository",
    probableFrameworks: detectFrameworks(filePaths),
    importantFiles,
    topAreas,
    dependencyHotspots: hotspots,
    hasTests: filePaths.some((path) => categorizePath(path) === "test"),
    hasCi: filePaths.some((path) => path.startsWith(".github/workflows/")),
  };
}

async function buildSummaries({
  repositoryName,
  description,
  insights,
}: {
  repositoryName: string;
  description: string;
  insights: RepoInsight;
}): Promise<RepoSummaries> {
  if (process.env.OPENAI_API_KEY) {
    try {
      const { OpenAI } = await import("openai");
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
        input: `Summarize this repository for developers in four short paragraphs. Base the answer only on these facts: ${JSON.stringify({
          repositoryName,
          description,
          insights,
        })}`,
      });

      const text = response.output_text || "";
      const paragraphs = text
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      if (paragraphs.length >= 3) {
        return {
          overview: paragraphs[0],
          architecture: paragraphs[1],
          gettingStarted: paragraphs[2],
          subsystemNotes: paragraphs.slice(3, 7),
          generatedWithAi: true,
        };
      }
    } catch {
      // Fall back to deterministic summaries below.
    }
  }

  return {
    overview: `${repositoryName} looks like a ${insights.projectType.toLowerCase()} with ${insights.probableFrameworks.join(", ") || "a general-purpose stack"}.`,
    architecture: `The repository is organized around ${insights.topAreas.map((item) => item.path).join(", ") || "a compact root layout"} with ${insights.dependencyHotspots.length} main dependency hotspots.`,
    gettingStarted: `Start with ${insights.importantFiles[0] ?? "the README"} and then inspect ${insights.topAreas[0]?.path ?? "the main source folder"} to understand the primary flow.`,
    subsystemNotes: insights.topAreas.map((item) => `${item.path}: ${item.role}`),
    generatedWithAi: false,
  };
}

export async function analyzeGithubRepository(owner: string, name: string) {
  const repo = await fetchGithubRepo(owner, name);
  const tree = await fetchGithubTree(owner, name, repo.defaultBranch);
  const filePaths = tree.tree.filter((entry) => entry.type === "blob").map((entry) => entry.path);

  const treeView = makeTree(tree.tree);
  const dependencyResult = await collectDependencyEdges(owner, name, filePaths);
  const graph = buildGraph(filePaths, dependencyResult.edges);
  const insights = buildInsights(filePaths, dependencyResult.counts);
  const summaries = await buildSummaries({
    repositoryName: `${owner}/${name}`,
    description: repo.description,
    insights,
  });

  const staleAfter = new Date(Date.now() + SNAPSHOT_TTL_HOURS * 60 * 60 * 1000).toISOString();

  return {
    repo,
    snapshot: {
      id: randomUUID(),
      repoId: "",
      branch: repo.defaultBranch,
      commitSha: tree.sha,
      tree: treeView,
      graph,
      insights,
      summaries,
      generatedAt: new Date().toISOString(),
      staleAfter,
    },
  };
}
