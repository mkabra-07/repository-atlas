"use client";

import type { TreeNode } from "@/lib/types";
import { cn } from "@/lib/utils";

function TreeBranch({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string | null) => void;
}) {
  if (!node.children) {
    return (
      <button
        className={cn("tree-node", selectedPath === node.path && "selected")}
        onClick={() => onSelect(node.path)}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
        type="button"
      >
        <span>{node.name}</span>
        {node.category ? <span className="node-meta">{node.category}</span> : null}
      </button>
    );
  }

  return (
    <div>
      {node.path ? (
        <button
          className={cn("tree-node", selectedPath === node.path && "selected")}
          onClick={() => onSelect(node.path)}
          style={{ paddingLeft: `${depth * 14 + 12}px` }}
          type="button"
        >
          <span>{node.name}</span>
          {node.category ? <span className="node-meta">{node.category}</span> : null}
        </button>
      ) : null}
      {node.children.map((child) => (
        <TreeBranch
          key={child.path}
          node={child}
          depth={depth + 1}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export function RepoTree({
  tree,
  selectedPath,
  onSelect,
}: {
  tree: TreeNode;
  selectedPath: string | null;
  onSelect: (path: string | null) => void;
}) {
  return (
    <div className="tree-scroll">
      <button className="button-ghost" onClick={() => onSelect(null)} type="button">
        Clear focus
      </button>
      {tree.children?.map((child) => (
        <TreeBranch key={child.path} depth={0} node={child} selectedPath={selectedPath} onSelect={onSelect} />
      ))}
    </div>
  );
}

