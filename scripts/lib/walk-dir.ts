import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export function walkDir(
  dir: string,
  predicate: (name: string) => boolean,
): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, predicate));
    } else if (entry.isFile() && predicate(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}
