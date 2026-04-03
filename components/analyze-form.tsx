"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AnalyzeForm() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="panel analyze-form"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);

        startTransition(async () => {
          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ repoUrl }),
          });

          const payload = await response.json();
          if (!response.ok) {
            setError(payload.error ?? "Unable to start analysis.");
            return;
          }

          router.push(payload.route);
        });
      }}
    >
      <label className="field">
        <span>Public GitHub repository URL</span>
        <input
          type="url"
          name="repoUrl"
          placeholder="https://github.com/vercel/next.js"
          value={repoUrl}
          onChange={(event) => setRepoUrl(event.target.value)}
          required
        />
      </label>
      <button className="button-primary" type="submit" disabled={isPending}>
        {isPending ? "Starting analysis..." : "Analyze repository"}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </form>
  );
}

