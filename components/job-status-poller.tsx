"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { AnalysisJobRecord } from "@/lib/types";

export function JobStatusPoller({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<AnalysisJobRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      const response = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        if (!cancelled) {
          setError(payload.error ?? "Unable to load job status.");
        }
        return;
      }

      if (cancelled) {
        return;
      }

      setJob(payload.job);

      if (payload.job.status === "completed" && payload.route) {
        router.replace(payload.route);
        return;
      }

      if (payload.job.status === "failed") {
        setError(payload.job.error ?? "Analysis failed.");
        return;
      }

      window.setTimeout(tick, 2000);
    }

    void tick();

    return () => {
      cancelled = true;
    };
  }, [jobId, router]);

  return (
    <div className="status-stack">
      <div className="progress-track">
        <div className="progress-bar" style={{ width: `${job?.progress ?? 5}%` }} />
      </div>
      <p className="status-line">{job?.stage ?? "Queued"}</p>
      <p className="muted">Status: {job?.status ?? "queued"}</p>
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}

