import { generateSW } from "workbox-build";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative, parse } from "node:path";

const STATIC_DIR = join(".next", "static");

function hashFile(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash("md5").update(content).digest("hex").slice(0, 8);
}

function walkDir(
  dir: string,
  predicate: (name: string) => boolean,
): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      results.push(...walkDir(fullPath, predicate));
    } else if (predicate(entry)) {
      results.push(fullPath);
    }
  }
  return results;
}

function findBuildIdDir(): string | null {
  if (!existsSync(STATIC_DIR)) return null;
  const entries = readdirSync(STATIC_DIR);
  for (const entry of entries) {
    const fullPath = join(STATIC_DIR, entry);
    if (statSync(fullPath).isDirectory() && entry !== "chunks" && entry !== "media") {
      return entry;
    }
  }
  return null;
}

function urlFromStaticPath(absolutePath: string): string {
  const rel = relative(STATIC_DIR, absolutePath);
  return `/_next/static/${rel}`;
}

async function main() {
  if (!existsSync(STATIC_DIR)) {
    console.error("Build output not found at .next/static/. Run `next build` first.");
    process.exit(1);
  }

  const manifestEntries: { url: string; revision: string }[] = [];

  const chunkDir = join(STATIC_DIR, "chunks");
  for (const filePath of walkDir(chunkDir, (n) => n.endsWith(".js") || n.endsWith(".css"))) {
    manifestEntries.push({
      url: urlFromStaticPath(filePath),
      revision: hashFile(filePath),
    });
  }

  const mediaDir = join(STATIC_DIR, "media");
  for (const filePath of walkDir(mediaDir, (n) => n.endsWith(".woff2"))) {
    manifestEntries.push({
      url: urlFromStaticPath(filePath),
      revision: hashFile(filePath),
    });
  }

  const buildIdDir = findBuildIdDir();
  if (buildIdDir) {
    const buildIdPath = join(STATIC_DIR, buildIdDir);
    for (const filePath of walkDir(buildIdPath, (n) => n.endsWith(".js"))) {
      manifestEntries.push({
        url: urlFromStaticPath(filePath),
        revision: hashFile(filePath),
      });
    }
  }

  const serverAppDir = join(".next", "server", "app");
  for (const filePath of walkDir(
    serverAppDir,
    (n) => n.endsWith(".html") && !n.startsWith("_") && n !== "404.html" && n !== "500.html",
  )) {
    const { name } = parse(filePath);
    const url = name === "index" ? "/" : `/${name}`;
    manifestEntries.push({ url, revision: hashFile(filePath) });
  }

  console.log(`Precaching ${manifestEntries.length} entries`);
  if (manifestEntries.length > 0) {
    console.log(`  Sample: ${manifestEntries[0]?.url} rev=${manifestEntries[0]?.revision}`);
  }

  const result = await generateSW({
    swDest: "public/sw.js",
    globDirectory: ".",
    globPatterns: [],
    additionalManifestEntries: manifestEntries,
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    navigateFallback: "/explorar",
    runtimeCaching: [
      {
        urlPattern: /\/geo-snapshot\.json$/,
        handler: "StaleWhileRevalidate",
        options: { cacheName: "snapshots" },
      },
      {
        urlPattern: /\/shelters-snapshot\.json$/,
        handler: "StaleWhileRevalidate",
        options: { cacheName: "snapshots" },
      },
      {
        urlPattern: /^\/($|\?.*$|explorar|abrigos)/,
        handler: "NetworkFirst",
        options: { cacheName: "pages" },
      },
    ],
  });

  console.log(`Service worker generated: ${result.count} entries, ${result.size} bytes`);
}

if (process.argv[1]?.endsWith("generate-sw.ts") || process.argv[1]?.endsWith("generate-sw")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
