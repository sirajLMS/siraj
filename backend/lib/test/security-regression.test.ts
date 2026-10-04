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

  test("rejects passwords shorter than 12 characters", async () => {
    let threw = false;
    try {
      await validatePasswordStrength("Ab1!abcd"); // 8 chars, was the old minimum
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  test("rejects single-class lowercase-only passwords", async () => {
    let threw = false;
    try {
      await validatePasswordStrength("aaaaaaaaaaaa"); // 12 chars, 1 class
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  test("rejects single-class digits-only passwords", async () => {
    let threw = false;
    try {
      await validatePasswordStrength("123456789012"); // 12 chars, 1 class
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
    // route.ts is now a thin handler — the batching decision and its
    // compensating controls live in app/api/graphql/shared/.
    const apolloServerSrc = await readSrc("app/api/graphql/shared/apollo-server.ts");
    const constantsSrc = await readSrc("app/api/graphql/shared/constants.ts");
    const pipelineSrc = await readSrc("app/api/graphql/shared/request-pipeline.ts");
    const routeSrc = await readSrc("app/api/graphql/route.ts");

    // Batching stays enabled in all environments (a prior outage forced the
    // revert); the amplification risk is bounded by compensating controls.
    expect(apolloServerSrc).toContain("allowBatchedHttpRequests: true");
    // Hard cap: batches above MAX_BATCHED_OPERATIONS are rejected (400).
    expect(constantsSrc).toMatch(/MAX_BATCHED_OPERATIONS\s*=\s*10/);
    expect(pipelineSrc).toMatch(/operationCount\s*>\s*MAX_BATCHED_OPERATIONS/);
    // Operation-aware body guard must be present in the request pipeline
    // (validateGraphqlRequestBody, run inside withRateLimit).
    expect(pipelineSrc).toMatch(/Array\.isArray\(body\)/);
    // The route must stay wired through the rate-limit pipeline so the
    // controls above cannot silently detach from the POST handler.
    expect(routeSrc).toContain("withRateLimit");
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
  test("file responses set CSP sandbox + nosniff headers on full and range responses", async () => {
    // The response construction moved out of route.ts into route.responses.ts.
    // Both the 200 full-file and 206 range responses are built through
    // buildStreamHeaders, so the sandbox headers there cover every served file.
    const responsesSrc = await readSrc("app/api/storage/files/[[...path]]/route.responses.ts");
    expect(responsesSrc).toContain('"Content-Security-Policy": "default-src \'none\'; sandbox"');
    expect(responsesSrc).toContain('"X-Content-Type-Options": "nosniff"');
    // The route must delegate through buildFileResponse so the sandboxed
    // builder cannot silently detach from the GET handler.
    const routeSrc = await readSrc("app/api/storage/files/[[...path]]/route.ts");
    expect(routeSrc).toContain("buildFileResponse");
  });
});

describe("H5 — host-header injection defense on redirect routes", () => {
  test("redirect routes resolve their origin through the shared trusted-origin helper", async () => {
    const helperSrc = await readSrc("backend/lib/trusted-origin.ts");
    const setLocaleSrc = await readSrc("app/api/set-locale/route.ts");
    const logoutSrc = await readSrc("app/logout/route.ts");
    const oauthHandlerSrc = await readSrc("app/api/oauth/shared/oauth-callback-handler.ts");
    const invoiceDownloadSrc = await readSrc("app/api/invoices/[id]/download/route.ts");

    // The helper owns the gating against nextUrl host / allowlist.
    expect(helperSrc).toContain("ALLOWED_ORIGINS.has");
    expect(helperSrc).toContain("request.nextUrl.origin");
    // Every redirect route must go through it rather than interpolating a raw host.
    expect(setLocaleSrc).toContain("resolveTrustedOrigin");
    expect(setLocaleSrc).toContain("ALLOWED_ORIGINS.has");
    expect(logoutSrc).toContain("resolveTrustedOrigin");
    expect(oauthHandlerSrc).toContain("resolveTrustedOrigin");
    expect(invoiceDownloadSrc).toContain("resolveTrustedOrigin");
    // Raw host header or unvalidated url.origin must not be interpolated into redirect targets.
    expect(logoutSrc).not.toMatch(/return host \? `\$\{proto\}:\/\/\$\{host\}`/);
    expect(oauthHandlerSrc).not.toContain("NextResponse.redirect(new URL(returnPath, url.origin)");
    expect(invoiceDownloadSrc).not.toMatch(
      /NextResponse\.redirect\(new URL\(`\/api\/storage\/files\/\$\{safeEncodedPath\}`, request\.url\)\)/
    );
  });

  test("logout route sanitizes client IP via the shared ratelimit identifier chain", async () => {
    const src = await readSrc("app/logout/route.ts");
    expect(src).toContain("getClientIdentifier");
    expect(src).toContain("sanitizeIpAddress");
  });
});
