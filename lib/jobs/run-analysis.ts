import { analyzeGithubRepository } from "@/lib/analysis/build-analysis";
import {
  saveSnapshot,
  updateJob,
  upsertRepository,
} from "@/lib/data/repository-store";

export async function processAnalysisJob(payload: { jobId: string; owner: string; name: string }) {
  await updateJob(payload.jobId, {
    status: "running",
    progress: 10,
    stage: "Fetching repository metadata",
    startedAt: new Date().toISOString(),
  });

  try {
    const analysis = await analyzeGithubRepository(payload.owner, payload.name);

    await updateJob(payload.jobId, {
      progress: 40,
      stage: "Building repository structure",
    });

    const repository = await upsertRepository({
      owner: payload.owner,
      name: payload.name,
      fullName: `${payload.owner}/${payload.name}`,
      githubUrl: `https://github.com/${payload.owner}/${payload.name}`,
      defaultBranch: analysis.repo.defaultBranch,
      description: analysis.repo.description,
      stars: analysis.repo.stars,
      primaryLanguage: analysis.repo.primaryLanguage,
      lastPushedAt: analysis.repo.pushedAt,
      visibility: "public",
    });

    await updateJob(payload.jobId, {
      progress: 75,
      stage: "Generating insights and summaries",
    });

    await saveSnapshot({
      ...analysis.snapshot,
      repoId: repository.id,
    });

    await updateJob(payload.jobId, {
      status: "completed",
      progress: 100,
      stage: "Analysis ready",
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    await updateJob(payload.jobId, {
      status: "failed",
      progress: 100,
      stage: "Analysis failed",
      error: error instanceof Error ? error.message : "Unknown analysis error",
      completedAt: new Date().toISOString(),
    });
  }
}
