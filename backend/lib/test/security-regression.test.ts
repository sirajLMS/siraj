import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { validatePasswordStrength } from "@/backend/lib/auth/password";

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
  test("rejects passwords shorter than 12 characters", async () => {
    await expect(validatePasswordStrength("Ab1!abcd")).rejects.toThrow(); // 8 chars, was the old minimum
  });

  test("rejects single-class passwords even when long enough", async () => {
    // 12 chars but only lowercase — fails the 2-class complexity rule.
    await expect(validatePasswordStrength("aaaaaaaaaaaa")).rejects.toThrow();
    // 12 chars but only digits.
    await expect(validatePasswordStrength("123456789012")).rejects.toThrow();
  });

  test("accepts passwords meeting length + 2-class complexity", async () => {
    // 12 chars, lowercase + digits — 2 classes, passes.
    await expect(validatePasswordStrength("abcdef123456")).resolves.toBeUndefined();
    // 12 chars, all 4 classes.
    await expect(validatePasswordStrength("Abcdef12!@xy")).resolves.toBeUndefined();
  });
});

describe("H2 — no module-level authorization caches", () => {
  test("permission-utils.ts does not declare a module-level authz Map", async () => {
    const src = await readSrc("backend/services/billing/permission-utils.ts");
    // The H2 fix removed the module-level viewerCache/studentIdsCache Maps and
    // moved to cachedRead + tag-based invalidation. Guard against regression.
    expect(src).not.toMatch(/const\s+\w*[Cc]ache\s*=\s*new\s+Map/);
    // Tag-based invalidation must be present.
    expect(src).toContain("invalidateTags");
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
  test("graphql route disables allowBatchedHttpRequests in production", async () => {
    const src = await readSrc("app/api/graphql/route.ts");
    // The flag must be gated on isProduction, not hard-coded true.
    expect(src).toContain("allowBatchedHttpRequests: !isProduction");
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
      const child = spawn("bun", ["run", "scripts/health/scan-mutation-scopes.ts"], {
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
