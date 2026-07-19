// @vitest-environment node
/**
 * Shared integration test setup.
 *
 * Every integration test must call `requireTestDbUrl()` to get the
 * `TEST_DIRECT_URL` value.  The function refuses to proceed if the URL
 * does not match the expected test-project marker, preventing
 * accidental destructive operations against the wrong database.
 *
 * Convention: the test database's Supabase project ref
 * (`ffetxfabaoafaqrrtoix`) is validated against the URL's `username`
 * field, which must be exactly `postgres.<ref>`.  This is the identity
 * field Supabase embeds in connection strings — it is NOT looked for
 * as a substring anywhere else in the URL, because a ref that appears
 * in the password or a query parameter does NOT prove the connection
 * targets the test project.
 *
 * If the test project is migrated to a different Supabase instance,
 * update `TEST_PROJECT_REF` here, the `.env` / `.env.example` files,
 * and the corresponding CI secret.
 */

import "dotenv/config";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export const TEST_PROJECT_REF = "ffetxfabaoafaqrrtoix";

const EXPECTED_USERNAME_PREFIX = "postgres.";

function formatExpectedUsername(): string {
  return `${EXPECTED_USERNAME_PREFIX}${TEST_PROJECT_REF}`;
}

export function requireTestDbUrl(): string {
  const rawUrl = process.env["TEST_DIRECT_URL"];
  if (!rawUrl) {
    throw new Error(
      "TEST_DIRECT_URL is not set. " +
        "Integration tests require a dedicated test database. " +
        "See .env.example for the expected environment variable."
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(
      `TEST_DIRECT_URL failed to parse as a URL: "${rawUrl}". ` +
        "Refusing to run destructive operations against an unparseable " +
        "database URL."
    );
  }

  const expected = formatExpectedUsername();
  if (parsed.username !== expected) {
    throw new Error(
      `TEST_DIRECT_URL does not point to the expected test database. ` +
        `Expected username to be "${expected}" (project ref ` +
        `"${TEST_PROJECT_REF}") but got "${parsed.username}". ` +
        `Refusing to run destructive operations against a database that ` +
        `does not match the test project.`
    );
  }

  return rawUrl;
}

export async function createTestClient(): Promise<PrismaClient> {
  const dbUrl = requireTestDbUrl();
  const adapter = new PrismaPg({ connectionString: dbUrl });
  return new PrismaClient({ adapter });
}
