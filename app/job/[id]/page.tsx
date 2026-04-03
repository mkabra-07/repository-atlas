import { JobStatusPoller } from "@/components/job-status-poller";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="shell shell-narrow">
      <div className="panel">
        <p className="eyebrow">Analysis in progress</p>
        <h1>We are mapping the repository now.</h1>
        <p className="muted">
          This page polls the background job and redirects to the shareable report as soon as the snapshot is ready.
        </p>
        <JobStatusPoller jobId={id} />
      </div>
    </main>
  );
}

