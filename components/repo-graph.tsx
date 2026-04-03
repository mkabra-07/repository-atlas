"use client";

import "reactflow/dist/style.css";

import { Background, Controls, MiniMap, ReactFlow } from "reactflow";

import type { AnalysisSnapshotRecord } from "@/lib/types";

function buildLayout(graph: AnalysisSnapshotRecord["graph"], selectedPath: string | null) {
  const nodes = graph.nodes.map((node, index) => ({
    id: node.id,
    position: {
      x: (index % 4) * 240,
      y: Math.floor(index / 4) * 140,
    },
    data: {
      label: (
        <div className={selectedPath === node.path ? "graph-node selected" : "graph-node"}>
          <strong>{node.label}</strong>
          <span>{node.kind}</span>
        </div>
      ),
    },
    style: {
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.14)",
      background: selectedPath === node.path ? "#ee7b39" : "#10243a",
      color: "white",
      width: 180,
      padding: 8,
    },
  }));

  const edges = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    animated: edge.type === "imports",
  }));

  return {
    nodes,
    edges,
  };
}

export function RepoGraph({
  graph,
  selectedPath,
  onSelect,
}: {
  graph: AnalysisSnapshotRecord["graph"];
  selectedPath: string | null;
  onSelect: (path: string | null) => void;
}) {
  const flow = buildLayout(graph, selectedPath);

  return (
    <div className="graph-canvas">
      <ReactFlow
        fitView
        nodes={flow.nodes}
        edges={flow.edges}
        onNodeClick={(_, node) => {
          const match = graph.nodes.find((item) => item.id === node.id);
          onSelect(match?.path ?? null);
        }}
      >
        <MiniMap />
        <Controls />
        <Background gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}

