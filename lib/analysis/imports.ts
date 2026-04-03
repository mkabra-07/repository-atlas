import { parse } from "@babel/parser";
import traverse from "@babel/traverse";

type ImportEdge = {
  source: string;
  target: string;
};

function normalizeRelativeImport(sourcePath: string, importPath: string) {
  if (!importPath.startsWith(".")) {
    return null;
  }

  const sourceParts = sourcePath.split("/");
  sourceParts.pop();
  const importParts = importPath.split("/");

  for (const part of importParts) {
    if (part === "." || part === "") {
      continue;
    }
    if (part === "..") {
      sourceParts.pop();
    } else {
      sourceParts.push(part);
    }
  }

  return sourceParts.join("/");
}

export function parseJavascriptImports(filePath: string, code: string) {
  const edges: ImportEdge[] = [];

  try {
    const ast = parse(code, {
      sourceType: "unambiguous",
      plugins: ["typescript", "jsx"],
    });

    traverse(ast, {
      ImportDeclaration(path: { node: { source: { value: string } } }) {
        const resolved = normalizeRelativeImport(filePath, path.node.source.value);
        if (resolved) {
          edges.push({
            source: filePath,
            target: resolved,
          });
        }
      },
    });
  } catch {
    return [];
  }

  return edges;
}

export function parsePythonImports(filePath: string, code: string) {
  const edges: ImportEdge[] = [];
  const lines = code.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("from .")) {
      const match = trimmed.match(/from\s+([.\w]+)/);
      if (match) {
        const resolved = normalizeRelativeImport(filePath, match[1].replace(/\./g, "/"));
        if (resolved) {
          edges.push({
            source: filePath,
            target: resolved,
          });
        }
      }
    }
  }

  return edges;
}
