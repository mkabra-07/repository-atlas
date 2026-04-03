import { NextResponse } from "next/server";

import { createJob, getRepository } from "@/lib/data/repository-store";
import { enqueueAnalysisJob } from "@/lib/jobs/queue";

export async function POST(_: Request, context: { params: Promise<{ owner: string; name: string }> }) {
  const params = await context.params;
  const repository = await getRepository(params.owner, params.name);

  if (!repository) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  const job = await createJob(repository.id, true);
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
}
