import "dotenv/config";
import { spawn, spawnSync } from "node:child_process";

const testDatabaseUrl = process.env["TEST_DIRECT_URL"];

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

const server = spawn("npx", ["next", "start", "-p", "3000"], {
  stdio: "inherit",
  env: process.env,
});

server.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
