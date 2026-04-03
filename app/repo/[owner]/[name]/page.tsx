import { notFound } from "next/navigation";

import { RefreshButton } from "@/components/refresh-button";
import { RepoDashboard } from "@/components/repo-dashboard";
import { getLatestSnapshot, getRepository } from "@/lib/data/repository-store";

async function loadRepo(owner: string, name: string) {
  const repository = await getRepository(owner, name);
  if (!repository) {
    return null;
  }

  const snapshot = await getLatestSnapshot(repository.id);

  return {
    repository,
    snapshot,
  };
}

export default async function RepoPage({ params }: { params: Promise<{ owner: string; name: string }> }) {
  const { owner, name } = await params;
  const payload = await loadRepo(owner, name);

  if (!payload || !payload.snapshot) {
    notFound();
  }

  return (
    <main className="shell">
      <header className="repo-header">
        <div>
          <p className="eyebrow">Shareable report</p>
          <h1>{payload.repository.fullName}</h1>
          <p className="muted">{payload.repository.description || "No description provided by the repository."}</p>
        </div>
        <RefreshButton owner={owner} name={name} />
      </header>
      <RepoDashboard repository={payload.repository} snapshot={payload.snapshot} />
    </main>
  );
}
