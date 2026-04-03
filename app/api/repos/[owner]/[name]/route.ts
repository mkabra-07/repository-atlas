import { NextResponse } from "next/server";

import { getLatestSnapshot, getRepository } from "@/lib/data/repository-store";

export async function GET(_: Request, context: { params: Promise<{ owner: string; name: string }> }) {
  const params = await context.params;
  const repository = await getRepository(params.owner, params.name);

  if (!repository) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  const snapshot = await getLatestSnapshot(repository.id);

  return NextResponse.json({
    repository,
    snapshot,
  });
}

