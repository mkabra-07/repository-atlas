import { PrismaClient } from "@prisma/client";

import type {
  AnalysisJobRecord,
  AnalysisSnapshotRecord,
  RepositoryRecord,
} from "@/lib/types";
import * as fileStore from "@/lib/data/file-store";

const prismaGlobal = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function getPrisma() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!prismaGlobal.prisma) {
    prismaGlobal.prisma = new PrismaClient();
  }

  return prismaGlobal.prisma;
}

function mapRepository(record: {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  githubUrl: string;
  defaultBranch: string | null;
  description: string | null;
  stars: number;
  primaryLanguage: string | null;
  lastPushedAt: Date | null;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
}): RepositoryRecord {
  return {
    id: record.id,
    owner: record.owner,
    name: record.name,
    fullName: record.fullName,
    githubUrl: record.githubUrl,
    defaultBranch: record.defaultBranch ?? undefined,
    description: record.description ?? undefined,
    stars: record.stars,
    primaryLanguage: record.primaryLanguage ?? undefined,
    lastPushedAt: record.lastPushedAt?.toISOString(),
    visibility: "public",
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapJob(record: {
  id: string;
  repoId: string;
  status: string;
  progress: number;
  stage: string;
  error: string | null;
  forceRefresh: boolean;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
}): AnalysisJobRecord {
  return {
    id: record.id,
    repoId: record.repoId,
    status: record.status as AnalysisJobRecord["status"],
    progress: record.progress,
    stage: record.stage,
    error: record.error ?? undefined,
    forceRefresh: record.forceRefresh,
    createdAt: record.createdAt.toISOString(),
    startedAt: record.startedAt?.toISOString(),
    completedAt: record.completedAt?.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapSnapshot(record: {
  id: string;
  repoId: string;
  branch: string;
  commitSha: string;
  treeJson: unknown;
  graphJson: unknown;
  insightsJson: unknown;
  summariesJson: unknown;
  generatedAt: Date;
  staleAfter: Date;
}): AnalysisSnapshotRecord {
  return {
    id: record.id,
    repoId: record.repoId,
    branch: record.branch,
    commitSha: record.commitSha,
    tree: record.treeJson as AnalysisSnapshotRecord["tree"],
    graph: record.graphJson as AnalysisSnapshotRecord["graph"],
    insights: record.insightsJson as AnalysisSnapshotRecord["insights"],
    summaries: record.summariesJson as AnalysisSnapshotRecord["summaries"],
    generatedAt: record.generatedAt.toISOString(),
    staleAfter: record.staleAfter.toISOString(),
  };
}

export async function upsertRepository(
  repository: Omit<RepositoryRecord, "id" | "createdAt" | "updatedAt">,
) {
  const prisma = getPrisma();
  if (!prisma) {
    return fileStore.upsertRepository(repository);
  }

  const saved = await prisma.repository.upsert({
    where: {
      fullName: repository.fullName,
    },
    create: {
      owner: repository.owner,
      name: repository.name,
      fullName: repository.fullName,
      githubUrl: repository.githubUrl,
      defaultBranch: repository.defaultBranch,
      description: repository.description,
      stars: repository.stars,
      primaryLanguage: repository.primaryLanguage,
      lastPushedAt: repository.lastPushedAt ? new Date(repository.lastPushedAt) : null,
      visibility: repository.visibility,
    },
    update: {
      githubUrl: repository.githubUrl,
      defaultBranch: repository.defaultBranch,
      description: repository.description,
      stars: repository.stars,
      primaryLanguage: repository.primaryLanguage,
      lastPushedAt: repository.lastPushedAt ? new Date(repository.lastPushedAt) : null,
      visibility: repository.visibility,
    },
  });

  return mapRepository(saved);
}

export async function getRepository(owner: string, name: string) {
  const prisma = getPrisma();
  if (!prisma) {
    return fileStore.getRepositoryByName(owner, name);
  }

  const record = await prisma.repository.findFirst({
    where: {
      owner: {
        equals: owner,
        mode: "insensitive",
      },
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });

  return record ? mapRepository(record) : null;
}

export async function getRepositoryById(id: string) {
  const prisma = getPrisma();
  if (!prisma) {
    return fileStore.getRepositoryById(id);
  }

  const record = await prisma.repository.findUnique({
    where: { id },
  });

  return record ? mapRepository(record) : null;
}

export async function createJob(repoId: string, forceRefresh = false) {
  const prisma = getPrisma();
  if (!prisma) {
    return fileStore.createJob({
      repoId,
      status: "queued",
      progress: 0,
      stage: "Queued",
      forceRefresh,
    });
  }

  const record = await prisma.analysisJob.create({
    data: {
      repoId,
      status: "queued",
      progress: 0,
      stage: "Queued",
      forceRefresh,
    },
  });

  return mapJob(record);
}

export async function updateJob(jobId: string, patch: Partial<AnalysisJobRecord>) {
  const prisma = getPrisma();
  if (!prisma) {
    return fileStore.updateJob(jobId, patch);
  }

  const record = await prisma.analysisJob.update({
    where: { id: jobId },
    data: {
      status: patch.status,
      progress: patch.progress,
      stage: patch.stage,
      error: patch.error,
      startedAt: patch.startedAt ? new Date(patch.startedAt) : undefined,
      completedAt: patch.completedAt ? new Date(patch.completedAt) : undefined,
    },
  });

  return mapJob(record);
}

export async function getJob(jobId: string) {
  const prisma = getPrisma();
  if (!prisma) {
    return fileStore.getJob(jobId);
  }

  const record = await prisma.analysisJob.findUnique({
    where: { id: jobId },
  });

  return record ? mapJob(record) : null;
}

export async function saveSnapshot(snapshot: AnalysisSnapshotRecord) {
  const prisma = getPrisma();
  if (!prisma) {
    return fileStore.saveSnapshot(snapshot);
  }

  const record = await prisma.analysisSnapshot.upsert({
    where: {
      repoId: snapshot.repoId,
    },
    create: {
      repoId: snapshot.repoId,
      branch: snapshot.branch,
      commitSha: snapshot.commitSha,
      treeJson: snapshot.tree,
      graphJson: snapshot.graph,
      insightsJson: snapshot.insights,
      summariesJson: snapshot.summaries,
      generatedAt: new Date(snapshot.generatedAt),
      staleAfter: new Date(snapshot.staleAfter),
    },
    update: {
      branch: snapshot.branch,
      commitSha: snapshot.commitSha,
      treeJson: snapshot.tree,
      graphJson: snapshot.graph,
      insightsJson: snapshot.insights,
      summariesJson: snapshot.summaries,
      generatedAt: new Date(snapshot.generatedAt),
      staleAfter: new Date(snapshot.staleAfter),
    },
  });

  return mapSnapshot(record);
}

export async function getLatestSnapshot(repoId: string) {
  const prisma = getPrisma();
  if (!prisma) {
    return fileStore.getLatestSnapshot(repoId);
  }

  const record = await prisma.analysisSnapshot.findFirst({
    where: { repoId },
  });

  return record ? mapSnapshot(record) : null;
}

