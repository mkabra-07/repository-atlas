import { NextResponse } from "next/server";

import { getJob, getRepositoryById } from "@/lib/data/repository-store";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const job = await getJob(params.id);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const repository = job.repoId ? await getRepositoryById(job.repoId) : null;

  return NextResponse.json({
    job,
    route: repository ? `/repo/${repository.owner}/${repository.name}` : null,
  });
}

