"use client";

import { useMemo, useState } from "react";

import { RepoGraph } from "@/components/repo-graph";
import { RepoTree } from "@/components/repo-tree";
import type { AnalysisSnapshotRecord, RepositoryRecord } from "@/lib/types";

type Tab = "overview" | "structure" | "relationships";

export function RepoDashboard({
  repository,
  snapshot,
}: {
  repository: RepositoryRecord;
  snapshot: AnalysisSnapshotRecord;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const filteredGraph = useMemo(() => {
    if (!selectedPath) {
      return snapshot.graph;
    }

    const nodes = snapshot.graph.nodes.filter(
      (node) =>
        node.path === selectedPath ||
        node.path.startsWith(`${selectedPath}/`) ||
        selectedPath.startsWith(`${node.path}/`),
    );

    const nodeIds = new Set(nodes.map((node) => node.id));
    const edges = snapshot.graph.edges.filter(
      (edge) => nodeIds.has(edge.source) || nodeIds.has(edge.target),
    );

    return {
      ...snapshot.graph,
      nodes,
      edges,
    };
  }, [selectedPath, snapshot.graph]);

  return (
    <div className="dashboard">
      <div className="tab-row">
        {(["overview", "structure", "relationships"] as Tab[]).map((item) => (
          <button
            key={item}
            className={tab === item ? "tab active" : "tab"}
            onClick={() => setTab(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <section className="overview-grid">
          <article className="panel">
            <h2>Snapshot</h2>
            <dl className="stats-grid">
              <div>
                <dt>Default branch</dt>
                <dd>{repository.defaultBranch ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Stars</dt>
                <dd>{repository.stars}</dd>
              </div>
              <div>
                <dt>Graph mode</dt>
                <dd>{snapshot.graph.granularity}</dd>
              </div>
              <div>
                <dt>Generated</dt>
                <dd>{new Date(snapshot.generatedAt).toLocaleString()}</dd>
              </div>
            </dl>
          </article>

          <article className="panel">
            <h2>Insights</h2>
            <p>{snapshot.summaries.overview}</p>
            <p>{snapshot.summaries.architecture}</p>
            <p>{snapshot.summaries.gettingStarted}</p>
          </article>

          <article className="panel">
            <h2>Framework hints</h2>
            <div className="badge-row">
              {snapshot.insights.probableFrameworks.map((item) => (
                <span className="badge" key={item}>
                  {item}
                </span>
              ))}
              {!snapshot.insights.probableFrameworks.length ? <span className="muted">No framework hints found.</span> : null}
            </div>
          </article>

          <article className="panel">
            <h2>Dependency hotspots</h2>
            <ul className="list">
              {snapshot.insights.dependencyHotspots.map((item) => (
                <li key={item.path}>
                  <span>{item.path}</span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
          </article>
        </section>
      ) : null}

      {tab === "structure" ? (
        <section className="two-column">
          <div className="panel">
            <h2>Repository tree</h2>
            <RepoTree tree={snapshot.tree} selectedPath={selectedPath} onSelect={setSelectedPath} />
          </div>
          <div className="panel">
            <h2>Focus</h2>
            <p className="muted">
              Select a file or folder to highlight its neighborhood in the graph and narrow the report context.
            </p>
            <p>{selectedPath ?? "Nothing selected yet."}</p>
          </div>
        </section>
      ) : null}

      {tab === "relationships" ? (
        <section className="panel graph-panel">
          <div className="graph-header">
            <div>
              <h2>Module graph</h2>
              <p className="muted">The graph is {snapshot.graph.granularity}-level to keep this repository readable.</p>
            </div>
          </div>
          <RepoGraph graph={filteredGraph} selectedPath={selectedPath} onSelect={setSelectedPath} />
        </section>
      ) : null}
    </div>
  );
}

