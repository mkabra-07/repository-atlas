import { NextResponse } from "next/server";

import { findCachedSnapshotByUrl, analyzeInputSchema } from "@/lib/api";
import { createJob, upsertRepository } from "@/lib/data/repository-store";
import { enqueueAnalysisJob } from "@/lib/jobs/queue";

export async function POST(request: Request) {
  try {
    const body = analyzeInputSchema.parse(await request.json());
    const cached = await findCachedSnapshotByUrl(body.repoUrl);

    if (cached.snapshot && cached.repository) {
      return NextResponse.json({
        status: "cached",
        route: `/repo/${cached.normalized.owner}/${cached.normalized.name}`,
      });
    }

    const repository =
      cached.repository ??
      (await upsertRepository({
        owner: cached.normalized.owner,
        name: cached.normalized.name,
        fullName: cached.normalized.fullName,
        githubUrl: cached.normalized.canonicalUrl,
        visibility: "public",
        stars: 0,
      }));

    const job = await createJob(repository.id, false);
    await enqueueAnalysisJob({
      jobId: job.id,
      owner: repository.owner,
      name: repository.name,
    });

    return NextResponse.json({
      status: "queued",
      jobId: job.id,
      route: `/job/${job.id}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid request",
      },
      { status: 400 },
    );
  }
}

