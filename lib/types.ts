export type RepoCoordinates = {
  owner: string;
  name: string;
};

export type RepositoryRecord = {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  githubUrl: string;
  defaultBranch?: string;
  description?: string;
  stars: number;
  primaryLanguage?: string;
  lastPushedAt?: string;
  visibility: "public";
  createdAt: string;
  updatedAt: string;
};

export type TreeNode = {
  path: string;
  name: string;
  type: "file" | "dir";
  children?: TreeNode[];
  category?: "code" | "test" | "config" | "docs" | "scripts" | "infra" | "generated" | "other";
  important?: boolean;
};

export type GraphNodeKind = "folder" | "file" | "entry" | "config" | "hotspot";

export type GraphNode = {
  id: string;
  label: string;
  path: string;
  kind: GraphNodeKind;
  fileType?: string;
  dependencyCount?: number;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  type: "imports" | "contains";
};

export type RepoInsight = {
  projectType: string;
  probableFrameworks: string[];
  importantFiles: string[];
  topAreas: Array<{ path: string; role: string }>;
  dependencyHotspots: Array<{ path: string; count: number }>;
  hasTests: boolean;
  hasCi: boolean;
};

export type RepoSummaries = {
  overview: string;
  architecture: string;
  gettingStarted: string;
  subsystemNotes: string[];
  generatedWithAi: boolean;
};

export type AnalysisSnapshotRecord = {
  id: string;
  repoId: string;
  branch: string;
  commitSha: string;
  tree: TreeNode;
  graph: {
    granularity: "folder" | "file";
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  insights: RepoInsight;
  summaries: RepoSummaries;
  generatedAt: string;
  staleAfter: string;
};

export type AnalysisJobRecord = {
  id: string;
  repoId: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  stage: string;
  error?: string;
  forceRefresh: boolean;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
};

export type RepoApiPayload = {
  repository: RepositoryRecord;
  snapshot: AnalysisSnapshotRecord | null;
};

