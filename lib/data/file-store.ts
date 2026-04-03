import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type {
  AnalysisJobRecord,
  AnalysisSnapshotRecord,
  RepositoryRecord,
} from "@/lib/types";
import { nowIso } from "@/lib/utils";

type StoreShape = {
  repositories: RepositoryRecord[];
  jobs: AnalysisJobRecord[];
  snapshots: AnalysisSnapshotRecord[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(STORE_FILE, "utf8");
  } catch {
    const empty: StoreShape = {
      repositories: [],
      jobs: [],
      snapshots: [],
    };

    await writeFile(STORE_FILE, JSON.stringify(empty, null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStore();
  const raw = await readFile(STORE_FILE, "utf8");
  return JSON.parse(raw) as StoreShape;
}

async function updateStore<T>(mutator: (store: StoreShape) => T): Promise<T> {
  const store = await readStore();
  const result = mutator(store);
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
  return result;
}

export async function upsertRepository(
  input: Omit<RepositoryRecord, "id" | "createdAt" | "updatedAt"> & { id?: string },
) {
  return updateStore((store) => {
    const existing = store.repositories.find((repo) => repo.fullName === input.fullName);
    const timestamp = nowIso();

    if (existing) {
      Object.assign(existing, input, { updatedAt: timestamp });
      return existing;
    }

    const created: RepositoryRecord = {
      ...input,
      id: input.id ?? randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    store.repositories.push(created);
    return created;
  });
}

export async function getRepositoryByName(owner: string, name: string) {
  const store = await readStore();
  return store.repositories.find(
    (repo) => repo.owner.toLowerCase() === owner.toLowerCase() && repo.name.toLowerCase() === name.toLowerCase(),
  ) ?? null;
}

export async function getRepositoryById(id: string) {
  const store = await readStore();
  return store.repositories.find((repo) => repo.id === id) ?? null;
}

export async function createJob(input: Omit<AnalysisJobRecord, "id" | "createdAt" | "updatedAt">) {
  return updateStore((store) => {
    const created: AnalysisJobRecord = {
      ...input,
      id: randomUUID(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    store.jobs.push(created);
    return created;
  });
}

export async function updateJob(
  jobId: string,
  patch: Partial<Omit<AnalysisJobRecord, "id" | "repoId" | "createdAt">>,
) {
  return updateStore((store) => {
    const job = store.jobs.find((item) => item.id === jobId);
    if (!job) {
      return null;
    }

    Object.assign(job, patch, { updatedAt: nowIso() });
    return job;
  });
}

export async function getJob(jobId: string) {
  const store = await readStore();
  return store.jobs.find((job) => job.id === jobId) ?? null;
}

export async function saveSnapshot(snapshot: AnalysisSnapshotRecord) {
  return updateStore((store) => {
    const existingIndex = store.snapshots.findIndex((item) => item.repoId === snapshot.repoId);
    if (existingIndex >= 0) {
      store.snapshots[existingIndex] = snapshot;
    } else {
      store.snapshots.push(snapshot);
    }

    return snapshot;
  });
}

export async function getLatestSnapshot(repoId: string) {
  const store = await readStore();
  return store.snapshots.find((snapshot) => snapshot.repoId === repoId) ?? null;
}

