export function cn(...tokens: Array<string | false | null | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

export function slugifyPath(path: string) {
  return path.replace(/[^a-zA-Z0-9-_/.]/g, "-");
}

export function nowIso() {
  return new Date().toISOString();
}

export function isStale(iso?: string) {
  if (!iso) {
    return true;
  }

  return new Date(iso).getTime() <= Date.now();
}

export function percentage(value: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}
