import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, readFileSync, mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { walkDir } from "../lib/walk-dir";
import { htmlFilePathToUrl, findBuildIdDir } from "../generate-sw";

const SW_PATH = join(process.cwd(), "public", "sw.js");

describe("service worker generation", () => {
  it("exists after build", () => {
    expect(existsSync(SW_PATH)).toBe(true);
  });

  it("contains precacheAndRoute", () => {
    const content = readFileSync(SW_PATH, "utf-8");
    expect(content).toContain("precacheAndRoute");
  });

  it("precaches app shell JS chunks at any depth", () => {
    const content = readFileSync(SW_PATH, "utf-8");
    const jsMatch = content.match(
      /\/_next\/static\/chunks\/.+\.js[^}]*revision:"[0-9a-f]{8}"/g,
    );
    expect(jsMatch).not.toBeNull();
    expect(jsMatch!.length).toBeGreaterThan(0);
  });

  it("precaches app shell CSS from any static subdirectory (chunks/ or css/)", () => {
    const content = readFileSync(SW_PATH, "utf-8");
    const cssMatch = content.match(
      /\/_next\/static\/(?:chunks|css)\/.+\.css[^}]*revision:"[0-9a-f]{8}"/g,
    );
    expect(cssMatch).not.toBeNull();
    expect(cssMatch!.length).toBeGreaterThan(0);
  });

  it("precaches self-hosted font files at any depth", () => {
    const content = readFileSync(SW_PATH, "utf-8");
    expect(content).toContain("/_next/static/media/");
    const fontMatch = content.match(
      /\/_next\/static\/media\/.+\.woff2[^}]*revision:"[0-9a-f]{8}"/g,
    );
    expect(fontMatch).not.toBeNull();
    expect(fontMatch!.length).toBeGreaterThan(0);
  });

  it("precaches the root HTML page (/)", () => {
    const content = readFileSync(SW_PATH, "utf-8");
    expect(content).toMatch(/url:"\/"[^}]*revision:"[0-9a-f]{8}"/);
  });

  it("precaches the explorar HTML page (/explorar) for navigateFallback", () => {
    const content = readFileSync(SW_PATH, "utf-8");
    expect(content).toMatch(/url:"\/explorar"[^}]*revision:"[0-9a-f]{8}"/);
  });

  it("has StaleWhileRevalidate runtime caching for geo-snapshot.json", () => {
    const content = readFileSync(SW_PATH, "utf-8");
    expect(content).toContain("StaleWhileRevalidate");
    expect(content).toMatch(/geo-snapshot.*StaleWhileRevalidate/);
  });

  it("has StaleWhileRevalidate runtime caching for shelters-snapshot.json", () => {
    const content = readFileSync(SW_PATH, "utf-8");
    expect(content).toMatch(/shelters-snapshot.*StaleWhileRevalidate/);
  });

  it("has skipWaiting and clientsClaim enabled", () => {
    const content = readFileSync(SW_PATH, "utf-8");
    expect(content).toContain("skipWaiting()");
    expect(content).toContain("clientsClaim()");
  });
});

describe("walkDir recursive directory scanner", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "sw-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns flat files matching predicate", () => {
    writeFileSync(join(tmpDir, "a.js"), "");
    writeFileSync(join(tmpDir, "b.css"), "");
    writeFileSync(join(tmpDir, "c.txt"), "");
    const results = walkDir(tmpDir, (n) => n.endsWith(".js") || n.endsWith(".css"));
    expect(results).toHaveLength(2);
    results.sort();
    expect(results[0]).toContain("a.js");
    expect(results[1]).toContain("b.css");
  });

  it("descends into subdirectories and returns files at any depth", () => {
    mkdirSync(join(tmpDir, "app"), { recursive: true });
    writeFileSync(join(tmpDir, "app", "layout.js"), "");
    mkdirSync(join(tmpDir, "app", "explorar"), { recursive: true });
    writeFileSync(join(tmpDir, "app", "explorar", "page.js"), "");
    writeFileSync(join(tmpDir, "root.js"), "");

    const results = walkDir(tmpDir, (n) => n.endsWith(".js"));
    expect(results).toHaveLength(3);
    expect(results.some((p) => p.endsWith("root.js"))).toBe(true);
    expect(results.some((p) => p.endsWith(join("app", "layout.js")))).toBe(true);
    expect(results.some((p) => p.endsWith(join("app", "explorar", "page.js")))).toBe(true);
  });

  it("does not include non-matching files in nested directories", () => {
    mkdirSync(join(tmpDir, "sub"), { recursive: true });
    writeFileSync(join(tmpDir, "keep.js"), "");
    writeFileSync(join(tmpDir, "sub", "skip.txt"), "");
    writeFileSync(join(tmpDir, "sub", "also-keep.css"), "");

    const results = walkDir(tmpDir, (n) => n.endsWith(".js") || n.endsWith(".css"));
    expect(results).toHaveLength(2);
    expect(results.some((p) => p.endsWith("keep.js"))).toBe(true);
    expect(results.some((p) => p.endsWith("also-keep.css"))).toBe(true);
  });

  it("works on a deep nesting structure matching the expected chunks path", () => {
    mkdirSync(join(tmpDir, "chunks"), { recursive: true });
    mkdirSync(join(tmpDir, "chunks", "app"), { recursive: true });
    mkdirSync(join(tmpDir, "chunks", "app", "explorar"), { recursive: true });
    writeFileSync(join(tmpDir, "chunks", "flat.js"), "");
    writeFileSync(join(tmpDir, "chunks", "app", "layout.js"), "");
    writeFileSync(
      join(tmpDir, "chunks", "app", "explorar", "page.js"),
      "",
    );

    const results = walkDir(tmpDir, (n) => n.endsWith(".js"));
    expect(results).toHaveLength(3);
    expect(results.some((p) => p.endsWith(join("chunks", "flat.js")))).toBe(true);
    expect(results.some((p) => p.endsWith(join("chunks", "app", "layout.js")))).toBe(true);
    expect(
      results.some((p) =>
        p.endsWith(join("chunks", "app", "explorar", "page.js")),
      ),
    ).toBe(true);
  });

  it("returns empty array for non-existent directory", () => {
    const results = walkDir(join(tmpDir, "nonexistent"), () => true);
    expect(results).toEqual([]);
  });

  it("returns empty array when no files match predicate", () => {
    writeFileSync(join(tmpDir, "a.txt"), "");
    mkdirSync(join(tmpDir, "sub"), { recursive: true });
    writeFileSync(join(tmpDir, "sub", "b.txt"), "");
    const results = walkDir(tmpDir, (n) => n.endsWith(".js"));
    expect(results).toEqual([]);
  });
});

describe("findBuildIdDir build-ID directory resolution", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "sw-buildid-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeBuildTree(entries: Record<string, boolean | string>): {
    staticDir: string;
    buildIdPath: string;
  } {
    const staticDir = join(tmpDir, "static");
    mkdirSync(staticDir, { recursive: true });
    for (const [name, value] of Object.entries(entries)) {
      if (typeof value === "string") {
        const buildIdPath = join(tmpDir, "BUILD_ID");
        writeFileSync(buildIdPath, value);
      } else {
        mkdirSync(join(staticDir, name), { recursive: true });
      }
    }
    return { staticDir, buildIdPath: join(tmpDir, "BUILD_ID") };
  }

  it("reads the build ID from BUILD_ID instead of guessing (css present, the bug case)", () => {
    const { staticDir, buildIdPath } = writeBuildTree({
      chunks: true,
      css: true,
      media: true,
      "d4e5f6g7h8i9j0k1l2m3n4o5-p6q7": true,
      BUILD_ID: "d4e5f6g7h8i9j0k1l2m3n4o5-p6q7",
    });
    expect(findBuildIdDir(staticDir, buildIdPath)).toBe("d4e5f6g7h8i9j0k1l2m3n4o5-p6q7");
  });

  it("returns null when the BUILD_ID file is empty", () => {
    const { staticDir, buildIdPath } = writeBuildTree({
      chunks: true,
      css: true,
      media: true,
      abc: true,
      BUILD_ID: "   \n",
    });
    expect(findBuildIdDir(staticDir, buildIdPath)).toBe("abc");
  });

  it("falls back to a directory scan when BUILD_ID is missing, excluding css", () => {
    const { staticDir, buildIdPath } = writeBuildTree({
      chunks: true,
      css: true,
      media: true,
      abc: true,
    });
    expect(findBuildIdDir(staticDir, buildIdPath)).toBe("abc");
  });

  it("falls back to a directory scan when BUILD_ID names a directory that does not exist", () => {
    const { staticDir, buildIdPath } = writeBuildTree({
      chunks: true,
      css: true,
      media: true,
      abc: true,
      BUILD_ID: "missing-build-id",
    });
    expect(findBuildIdDir(staticDir, buildIdPath)).toBe("abc");
  });

  it("returns null when the static directory does not exist", () => {
    const { buildIdPath } = writeBuildTree({
      BUILD_ID: "abc",
    });
    expect(findBuildIdDir(join(tmpDir, "nonexistent"), buildIdPath)).toBeNull();
  });

  it("returns null when only chunks, media, and css exist (no build-ID directory)", () => {
    const { staticDir, buildIdPath } = writeBuildTree({
      chunks: true,
      css: true,
      media: true,
    });
    expect(findBuildIdDir(staticDir, buildIdPath)).toBeNull();
  });
});

describe("htmlFilePathToUrl", () => {
  const SERVER_APP = join(".next", "server", "app");

  it("maps root index.html to /", () => {
    expect(htmlFilePathToUrl(SERVER_APP, join(SERVER_APP, "index.html"))).toBe("/");
  });

  it("maps a flat route like explorar.html to /explorar", () => {
    expect(htmlFilePathToUrl(SERVER_APP, join(SERVER_APP, "explorar.html"))).toBe("/explorar");
  });

  it("preserves nested route segments (the original bug)", () => {
    expect(htmlFilePathToUrl(SERVER_APP, join(SERVER_APP, "foo", "bar.html"))).toBe("/foo/bar");
  });

  it("maps subdirectory index.html to the parent path", () => {
    expect(htmlFilePathToUrl(SERVER_APP, join(SERVER_APP, "a", "b", "index.html"))).toBe("/a/b");
  });

  it("handles three-level nesting", () => {
    expect(htmlFilePathToUrl(SERVER_APP, join(SERVER_APP, "a", "b", "c.html"))).toBe("/a/b/c");
  });
});
