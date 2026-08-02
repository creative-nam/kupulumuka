import "dotenv/config";
import { spawn, spawnSync } from "node:child_process";
import { join } from "node:path";

const testDatabaseUrl = process.env["TEST_DIRECT_URL"];
const port = process.env["PORT"] ?? "3000";
const nextBin = join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");

if (!testDatabaseUrl) {
  console.error("TEST_DIRECT_URL is not set. Cannot start the e2e preview server.");
  process.exit(1);
}

process.env["DATABASE_URL"] = testDatabaseUrl;
process.env["DIRECT_URL"] = testDatabaseUrl;

const build = spawnSync("npm", ["run", "build:e2e"], {
  stdio: "inherit",
  env: process.env,
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const server = spawn(process.execPath, [nextBin, "start", "-p", port], {
  stdio: "inherit",
  env: process.env,
});

let shuttingDown = false;

function forwardSignal(signal: NodeJS.Signals) {
  if (shuttingDown) {
    process.exit(1);
  }
  shuttingDown = true;
  server.kill(signal);
}

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));

server.on("error", (error) => {
  console.error(`Failed to start the e2e preview server (next start -p ${port}): ${error.message}`);
  process.exit(1);
});

server.on("exit", (code, signal) => {
  if (shuttingDown) {
    process.exit(code ?? 0);
    return;
  }
  if (signal) {
    process.kill(process.pid, signal);
    setTimeout(() => process.exit(1), 1000).unref();
    return;
  }
  process.exit(code ?? 0);
});
