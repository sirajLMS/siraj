import { describe, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PASSWORD_MAX_LENGTH, validatePasswordStrength } from "@/backend/lib/auth/password";

/**
 * Security regression suite — covers the fixes from the pentest-audit plan
 * (.ai/plans/pentest-audit/plan-20260824_205827.refined.md). Unit-level where
 * possible (no DB); static fs guards for the cross-cutting invariants.
 *
 * Run: `bun --env-file=.env.test test backend/lib/test/security-regression.test.ts`
 */

const REPO_ROOT = process.cwd();

async function readSrc(rel: string): Promise<string> {
  return readFile(join(REPO_ROOT, rel), "utf8");
}

describe("M5 — password policy", () => {
  // NOTE: uses try/catch rather than `await expect().resolves/rejects` because
  // oxlint's `await-thenable` rule mis-flags the bun:test resolves/rejects
  // matcher chain as non-Promise-like.

  test.each([
    ["passwords shorter than 12 characters", "Ab1!abcd"],
    ["single-class lowercase-only passwords", "aaaaaaaaaaaa"],
    ["single-class digits-only passwords", "123456789012"],
  ])("rejects %s", async (_, invalidPassword) => {
    let threw = false;
    try {
      await validatePasswordStrength(invalidPassword);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  test("accepts passwords meeting length + 2-class complexity", async () => {
    let threw = false;
    try {
      // 12 chars, lowercase + digits — 2 classes, passes (no throw).
      await validatePasswordStrength("abcdef123456");
      // 12 chars, all 4 classes.
      await validatePasswordStrength("Abcdef12!@xy");
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
  });

  test("rejects passwords exceeding PASSWORD_MAX_LENGTH to prevent bcrypt DoS", async () => {
    let threw = false;
    try {
      const overlongPassword = `A1${"a".repeat(PASSWORD_MAX_LENGTH)}`;
      await validatePasswordStrength(overlongPassword);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

describe("H2 — no module-level authorization caches", () => {
  test("permission-utils.ts does not declare a module-level authz Map", async () => {
    const src = await readSrc("backend/services/billing/permission-utils.ts");
    // The H2 fix removed the module-level viewerCache/studentIdsCache Maps and
    // moved to tag-indexed cachedRead. Guard against regression.
    expect(src).not.toMatch(/const\s+\w*[Cc]ache\s*=\s*new\s+Map/);
    // Caching must go through the shared tag-indexed cache service.
    expect(src).toContain("cachedRead");
  });
});

describe("H4 — trusted-proxy client identification", () => {
  test("ratelimit.ts gates x-forwarded-for behind a trusted-proxy flag and validates with isIP", async () => {
    const src = await readSrc("backend/lib/ratelimit.ts");
    expect(src).toContain("isIP");
    // The trusted-proxy gate must NOT trust XFF unconditionally.
    expect(src).toMatch(/TRUSTED_PROXY|VERCEL|CLOUDFLARE/);
  });
});

describe("H3 — GraphQL batched-request amplification", () => {
  test("graphql route keeps batching enabled with hard compensating controls", async () => {
    const src = await readSrc("app/api/graphql/route.ts");
    // Batching stays enabled in all environments (a prior outage forced the
    // revert); the amplification risk is bounded by compensating controls.
    expect(src).toContain("allowBatchedHttpRequests: true");
    // Hard cap: batches above MAX_BATCHED_OPERATIONS are rejected (400).
    expect(src).toMatch(/MAX_BATCHED_OPERATIONS\s*=\s*10/);
    expect(src).toMatch(/operationCount\s*>\s*MAX_BATCHED_OPERATIONS/);
    // Operation-aware body guard must be present in withRateLimit.
    expect(src).toMatch(/Array\.isArray\(body\)/);
  });
});

describe("H8 — mutation notImpersonating CI guard", () => {
  test("scan-mutation-scopes.ts exists and is executable", async () => {
    const src = await readSrc("scripts/health/scan-mutation-scopes.ts");
    expect(src).toContain("notImpersonating");
    expect(src).toContain("ALLOW_LIST");
    // The script must define the allow-list of impersonation-safe mutations.
    expect(src).toContain("endImpersonation");
  });

  test("scan-mutation-scopes.ts runs and produces a verdict (exit 0 or 1)", async () => {
    // The script may report baseline violations (the full sweep is a follow-up);
    // this test only asserts it EXECUTES without crashing (a real exit code).
    const exitCode = await new Promise<number>((resolve, reject) => {
      // process.execPath is the absolute path to the running bun binary — avoids
      // sonarjs/no-os-command-from-path (spawning "bun" by name from PATH).
      const child = spawn(process.execPath, ["scripts/health/scan-mutation-scopes.ts"], {
        cwd: REPO_ROOT,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout?.on("data", d => {
        stdout += d.toString();
      });
      child.stderr?.on("data", d => {
        stderr += d.toString();
      });
      child.on("error", reject);
      child.on("close", code => {
        // Either 0 (compliant) or 1 (violations reported) is a successful run.
        // Any other code (e.g. crash/NaN) is a test failure.
        if (code === 0 || code === 1) resolve(code);
        else reject(new Error(`scan-mutation-scopes exited with ${code}\nstdout: ${stdout}\nstderr: ${stderr}`));
      });
    });
    expect([0, 1]).toContain(exitCode);
  });
});

describe("H9 — super_admin demo-login exclusion", () => {
  test("demo-auth.service.ts excludes super_admin from demo login", async () => {
    const src = await readSrc("backend/services/auth/demo-auth.service.ts");
    expect(src).toContain("EXCLUDED_DEMO_LOGIN_GROUP_SLUGS");
    expect(src).toMatch(/"super_admin"|super_admin/);
  });
});

describe("M1 — security headers", () => {
  test("proxy.ts sets HSTS + nosniff + Referrer-Policy in production", async () => {
    const src = await readSrc("proxy.ts");
    expect(src).toContain("Strict-Transport-Security");
    expect(src).toContain("X-Content-Type-Options");
    expect(src).toContain("Referrer-Policy");
    expect(src).toContain("object-src 'none'");
  });
});

describe("M3 — extended RLS migration file", () => {
  test("extended_rls_policies.sql exists and covers the financial/credential tables", async () => {
    const src = await readSrc("backend/db/migration/extended_rls_policies.sql");
    for (const table of [
      "payments",
      "quota_ledger",
      "user_payment_methods",
      "meeting_provider_tokens",
      "teacher_dues",
      "audit_logs",
    ]) {
      expect(src).toContain(table);
    }
    // Must enable + force RLS.
    expect(src).toContain("ENABLE ROW LEVEL SECURITY");
    expect(src).toContain("FORCE ROW LEVEL SECURITY");
  });
});

describe("M11 — storage file responses are sandboxed", () => {
  test("route.ts sets CSP sandbox header on full and range responses", async () => {
    const src = await readSrc("app/api/storage/files/[[...path]]/route.ts");
    expect(src).toContain('"Content-Security-Policy": "default-src \'none\'; sandbox"');
    expect(src).toContain('"X-Content-Type-Options": "nosniff"');
  });
});

describe("H5 — host-header injection defense on redirect routes", () => {
  test("set-locale, logout, and OAuth callback routes never redirect to a client-supplied unknown host", async () => {
    const setLocaleSrc = await readSrc("app/api/set-locale/route.ts");
    const logoutSrc = await readSrc("app/logout/route.ts");
    const oauthHandlerSrc = await readSrc("app/api/oauth/shared/oauth-callback-handler.ts");

    // All must gate candidate host headers against nextUrl host / allowlist.
    expect(setLocaleSrc).toContain("resolveTrustedOrigin");
    expect(setLocaleSrc).toContain("ALLOWED_ORIGINS.has");
    expect(logoutSrc).toContain("ALLOWED_ORIGINS.has");
    expect(oauthHandlerSrc).toContain("resolveTrustedOrigin");
    expect(oauthHandlerSrc).toContain("ALLOWED_ORIGINS.has");
    // Raw host header or unvalidated url.origin must not be interpolated into redirect targets directly.
    expect(logoutSrc).not.toMatch(/return host \? `\$\{proto\}:\/\/\$\{host\}`/);
    expect(oauthHandlerSrc).not.toContain("NextResponse.redirect(new URL(returnPath, url.origin)");
  });

  test("logout route sanitizes client IP via the shared ratelimit identifier chain", async () => {
    const src = await readSrc("app/logout/route.ts");
    expect(src).toContain("getClientIdentifier");
    expect(src).toContain("sanitizeIpAddress");
  });
});
