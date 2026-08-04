// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { requireTestDbUrl, TEST_PROJECT_REF } from "./setup";

const VALID_URL =
  `postgresql://postgres.${TEST_PROJECT_REF}:realpass@aws-0-eu-west-3.pooler.supabase.com:5432/postgres`;

const ORIGINAL_TEST_DIRECT_URL = process.env["TEST_DIRECT_URL"];

beforeEach(() => {
  delete process.env["TEST_DIRECT_URL"];
});

afterEach(() => {
  if (ORIGINAL_TEST_DIRECT_URL !== undefined) {
    process.env["TEST_DIRECT_URL"] = ORIGINAL_TEST_DIRECT_URL;
  } else {
    delete process.env["TEST_DIRECT_URL"];
  }
});

describe("requireTestDbUrl guardrail", () => {
  it("throws when TEST_DIRECT_URL is not set", () => {
    expect(() => requireTestDbUrl()).toThrow("TEST_DIRECT_URL is not set");
  });

  it("throws when URL fails to parse", () => {
    process.env["TEST_DIRECT_URL"] = "x";
    expect(() => requireTestDbUrl()).toThrow(
      "failed to parse as a URL",
    );
  });

  it("throws when URL has no credentials at all", () => {
    // Without credentials the URL is still parseable, but there is no
    // username to check. This case shouldn't arise in practice with
    // Supabase connection strings, but guards against regressions.
    process.env["TEST_DIRECT_URL"] =
      "postgresql://isolated-host.supabase.co:5432/postgres";
    expect(() => requireTestDbUrl()).toThrow(
      /Expected username to be "postgres\./,
    );
  });

  it("throws when ref is in the password but username has wrong ref (CodeRabbit bypass)", () => {
    // The old substring check would pass this because it finds the ref
    // somewhere in the URL. The proper check rejects it because the
    // username is "postgres.wrongref", not "postgres.<TEST_PROJECT_REF>".
    process.env["TEST_DIRECT_URL"] =
      `postgresql://postgres.wrongref:${TEST_PROJECT_REF}@aws-0-eu-west-3.pooler.supabase.com:5432/postgres`;
    expect(() => requireTestDbUrl()).toThrow(
      /Expected username to be "postgres\./,
    );
    expect(() => requireTestDbUrl()).toThrow(
      `but got "postgres.wrongref"`,
    );
  });

  it("throws when ref is in a query parameter but username has wrong ref", () => {
    process.env["TEST_DIRECT_URL"] =
      `postgresql://postgres.wrongref:pass@host:5432/postgres?ref=${TEST_PROJECT_REF}`;
    expect(() => requireTestDbUrl()).toThrow(
      /Expected username to be "postgres\./,
    );
    expect(() => requireTestDbUrl()).toThrow(
      `but got "postgres.wrongref"`,
    );
  });

  it("throws when ref is in the URL path but username has wrong ref", () => {
    process.env["TEST_DIRECT_URL"] =
      `postgresql://postgres.wrongref:pass@host:5432/${TEST_PROJECT_REF}`;
    expect(() => requireTestDbUrl()).toThrow(
      /Expected username to be "postgres\./,
    );
  });

  it("throws when username has a completely different ref", () => {
    // Simulates a dev/prod URL accidentally used as TEST_DIRECT_URL
    process.env["TEST_DIRECT_URL"] =
      "postgresql://postgres.lnuwsgxnusuyvyqlbxba:prodpass@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";
    expect(() => requireTestDbUrl()).toThrow(
      /Expected username to be "postgres\./,
    );
    expect(() => requireTestDbUrl()).toThrow(
      `but got "postgres.lnuwsgxnusuyvyqlbxba"`,
    );
  });

  it("returns the URL when username matches exactly", () => {
    process.env["TEST_DIRECT_URL"] = VALID_URL;
    expect(requireTestDbUrl()).toBe(VALID_URL);
  });

  it("does not throw for pooler variant with pgbouncer=true", () => {
    const url = `${VALID_URL}?pgbouncer=true`;
    process.env["TEST_DIRECT_URL"] = url;
    expect(requireTestDbUrl()).toBe(url);
  });
});
