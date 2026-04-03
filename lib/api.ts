import { z } from "zod";

import { getLatestSnapshot, getRepository } from "@/lib/data/repository-store";
import { normalizeGithubRepoUrl } from "@/lib/github/normalize";
import { isStale } from "@/lib/utils";

export const analyzeInputSchema = z.object({
  repoUrl: z.string().min(1),
});

export async function findCachedSnapshotByUrl(repoUrl: string) {
  const normalized = normalizeGithubRepoUrl(repoUrl);
  const repository = await getRepository(normalized.owner, normalized.name);
  if (!repository) {
    return {
      normalized,
      repository: null,
      snapshot: null,
    };
  }

  const snapshot = await getLatestSnapshot(repository.id);
  if (!snapshot || isStale(snapshot.staleAfter)) {
    return {
      normalized,
      repository,
      snapshot: null,
    };
  }

  return {
    normalized,
    repository,
    snapshot,
  };
}

