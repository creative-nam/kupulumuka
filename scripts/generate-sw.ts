import { generateSW } from "workbox-build";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { walkDir } from "./lib/walk-dir";

const STATIC_DIR = join(".next", "static");

function hashFile(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash("md5").update(content).digest("hex").slice(0, 8);
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

export function htmlFilePathToUrl(serverAppDir: string, filePath: string): string {
  const rel = relative(serverAppDir, filePath).split(sep).join("/").replace(/\.html$/, "");
  if (rel === "index" || rel.endsWith("/index")) {
    const stripped = rel.replace(/(^|\/)index$/, "");
    return stripped === "" ? "/" : `/${stripped}`;
  }
  return `/${rel}`;
}

async function main() {
  if (!existsSync(STATIC_DIR)) {
    console.error("Build output not found at .next/static/. Run `next build` first.");
    process.exit(1);
  }

  const manifestEntries: { url: string; revision: string }[] = [];

  // Turbopack puts CSS in chunks/, webpack puts it in css/ — scan both.
  const cssDirs = ["chunks", "css"].map((d) => join(STATIC_DIR, d)).filter(existsSync);
  for (const dir of cssDirs) {
    for (const filePath of walkDir(dir, (n) => n.endsWith(".css"))) {
      manifestEntries.push({
        url: urlFromStaticPath(filePath),
        revision: hashFile(filePath),
      });
    }
  }

  const chunkDir = join(STATIC_DIR, "chunks");
  for (const filePath of walkDir(chunkDir, (n) => n.endsWith(".js"))) {
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
    const url = htmlFilePathToUrl(serverAppDir, filePath);
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
