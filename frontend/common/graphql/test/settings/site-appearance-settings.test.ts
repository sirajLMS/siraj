import { describe, expect, test } from "bun:test";
import {
  appearanceSettingsQueryDocument,
  publishAppearanceMutationDocument,
  resetAppearanceDraftMutationDocument,
  saveAppearanceDraftMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/site-appearance-settings.documents";
import {
  assertOperationDenied,
  authenticatedRequest,
  loginAndProvision,
  setupTestServerLifecycle,
} from "@/test/helpers";

/**
 * GraphQL integration tests for the Site Appearance Customization feature
 * (Task 10.2 — Tier 1 happy paths + Tier 4 security/XSS).
 *
 * Covers:
 *   - Tier 1: appearanceSettings query (draft=false / draft=true),
 *     saveAppearanceDraft, publishAppearance, resetAppearanceDraft
 *     mutations — all happy paths (AC-5, AC-6, AC-8, AC-9).
 *   - Tier 4 (security): unauthorized mutation attempts for users without
 *     SETTINGS_APPEARANCE_MANAGE (AC-7, AC-39), and XSS payload
 *     sanitization on siteName / siteDescription (AC-34).
 *
 * The `appearance_settings` table is a single global row. Tests mutate
 * shared state; we seed a known default at the start (via saveDraft +
 * publish in the first mutation test) and restore that default at the
 * end so the suite is idempotent across runs.
 */

describe("GraphQL Site Appearance Settings Integration Tests", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";

  const DEFAULT_INPUT = {
    colors: {
      light: { primaryMain: "#1976d2", secondaryMain: "#dc004e" },
      dark: { primaryMain: "#90caf9", secondaryMain: "#f48fb1" },
    },
    logoUrl: null,
    siteName: "Siraj Test Platform",
    siteTitle: "Siraj Test Platform Title",
    siteDescription: "Integration test description for appearance settings.",
    defaultColorScheme: "light",
  } as const;

  test("provision super admin for appearance settings tests", async () => {
    const provisioned = await loginAndProvision("AppearanceSettingsTest");
    superAdminToken = provisioned.superAdminToken;
    expect(superAdminToken).not.toBe("");
  });

  // ─── Tier 1: Query happy paths (AC-5, AC-6) ───────────────────────────────

  test("super admin can read appearanceSettings with draft=false (AC-5)", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", appearanceSettingsQueryDocument, {
      draft: false,
    });
    // Row may be null if unseeded; the call itself must succeed without
    // throwing a permissions error.
    expect(data.appearanceSettings === null || typeof data.appearanceSettings === "object").toBeTrue();
  });

  test("super admin can read appearanceSettings with draft=true (AC-5, AC-6)", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", appearanceSettingsQueryDocument, {
      draft: true,
    });
    expect(data.appearanceSettings === null || typeof data.appearanceSettings === "object").toBeTrue();
  });

  // ─── Tier 1: Mutation happy paths (AC-8, AC-9) ────────────────────────────

  test("super admin can save an appearance draft (AC-8)", async () => {
    const data = await authenticatedRequest(superAdminToken, "mutate", saveAppearanceDraftMutationDocument, {
      input: DEFAULT_INPUT,
      expectedUpdatedAt: undefined,
    });
    const saved = data.saveAppearanceDraft;
    expect(saved).not.toBeNull();
    expect(saved?.id).toBeDefined();
    expect(saved?.draftFields?.siteName).toBe(DEFAULT_INPUT.siteName);
    expect(saved?.draftFields?.siteTitle).toBe(DEFAULT_INPUT.siteTitle);
    expect(saved?.draftFields?.siteDescription).toBe(DEFAULT_INPUT.siteDescription);
    expect(saved?.draftFields?.defaultColorScheme).toBe(DEFAULT_INPUT.defaultColorScheme);
    expect(saved?.draftFields?.colors?.light?.primaryMain).toBe(DEFAULT_INPUT.colors.light.primaryMain);
    expect(saved?.draftFields?.colors?.dark?.secondaryMain).toBe(DEFAULT_INPUT.colors.dark.secondaryMain);
  });

  test("super admin can publish the appearance draft (AC-9)", async () => {
    const data = await authenticatedRequest(superAdminToken, "mutate", publishAppearanceMutationDocument, {
      expectedUpdatedAt: undefined,
    });
    const published = data.publishAppearance;
    expect(published).not.toBeNull();
    // After publish, published columns should match draftFields.
    expect(published?.siteName).toBe(DEFAULT_INPUT.siteName);
    expect(published?.siteTitle).toBe(DEFAULT_INPUT.siteTitle);
    expect(published?.siteDescription).toBe(DEFAULT_INPUT.siteDescription);
    expect(published?.draftFields?.siteName).toBe(published?.siteName);
  });

  test("super admin can reset the appearance draft (AC-8)", async () => {
    // First, diverge the draft from the published state.
    await authenticatedRequest(superAdminToken, "mutate", saveAppearanceDraftMutationDocument, {
      input: { ...DEFAULT_INPUT, siteName: "Diverged Draft Name" },
      expectedUpdatedAt: undefined,
    });
    // Then reset.
    const data = await authenticatedRequest(superAdminToken, "mutate", resetAppearanceDraftMutationDocument, {});
    const reset = data.resetAppearanceDraft;
    expect(reset).not.toBeNull();
    // After reset, draft should match published (which we set to DEFAULT_INPUT above).
    expect(reset?.draftFields?.siteName).toBe(reset?.siteName);
    expect(reset?.draftFields?.siteName).toBe(DEFAULT_INPUT.siteName);
  });

  // ─── Tier 4 (security): unauthorized mutation attempts (AC-7, AC-39) ──────

  test("teacher (no SETTINGS_APPEARANCE_MANAGE) cannot save appearance draft (AC-7)", async () => {
    const denied = await assertOperationDenied("teacher_default", "mutate", saveAppearanceDraftMutationDocument, {
      input: DEFAULT_INPUT,
      expectedUpdatedAt: undefined,
    });
    expect(denied).toBeTrue();
  });

  test("teacher (no SETTINGS_APPEARANCE_MANAGE) cannot publish appearance (AC-7)", async () => {
    const denied = await assertOperationDenied("teacher_default", "mutate", publishAppearanceMutationDocument, {
      expectedUpdatedAt: undefined,
    });
    expect(denied).toBeTrue();
  });

  test("teacher (no SETTINGS_APPEARANCE_MANAGE) cannot reset appearance draft (AC-7)", async () => {
    const denied = await assertOperationDenied("teacher_default", "mutate", resetAppearanceDraftMutationDocument, {});
    expect(denied).toBeTrue();
  });

  test("teacher (no SETTINGS_APPEARANCE_MANAGE) cannot read draft view (draft=true) (AC-7)", async () => {
    const denied = await assertOperationDenied("teacher_default", "query", appearanceSettingsQueryDocument, {
      draft: true,
    });
    expect(denied).toBeTrue();
  });

  // ─── Tier 4 (security): XSS payload sanitization (AC-34) ──────────────────

  test("XSS payload in siteName / siteTitle / siteDescription is sanitized (AC-34)", async () => {
    const xssInput = {
      ...DEFAULT_INPUT,
      siteName: '<script>alert("xss")</script>SafeName',
      siteTitle: '<img src=x onerror="alert(1)">SafeTitle',
      siteDescription: "<p>ok</p><script>alert(1)</script>",
    };
    const data = await authenticatedRequest(superAdminToken, "mutate", saveAppearanceDraftMutationDocument, {
      input: xssInput,
      expectedUpdatedAt: undefined,
    });
    const saved = data.saveAppearanceDraft;
    expect(saved).not.toBeNull();
    // siteName must not contain raw <script> tag (sanitized by
    // sanitizeSiteName via DOMPurify + tag strip — Task 9.8).
    expect(saved?.draftFields?.siteName).not.toContain("<script>");
    expect(saved?.draftFields?.siteName).not.toContain("</script>");
    // siteTitle must not contain the onerror= attribute (DOMPurify strips
    // disallowed attributes even on allowed tags).
    expect(saved?.draftFields?.siteTitle).not.toContain("onerror");
    // siteDescription must not contain <script> tag (DOMPurify strips
    // disallowed tags; <p> is in the allowlist and may be preserved).
    expect(saved?.draftFields?.siteDescription).not.toContain("<script>");
    expect(saved?.draftFields?.siteDescription).not.toContain("</script>");
  });

  // ─── Cleanup: restore default state so suite is idempotent ────────────────

  test("restore default appearance state after test run", async () => {
    await authenticatedRequest(superAdminToken, "mutate", saveAppearanceDraftMutationDocument, {
      input: DEFAULT_INPUT,
      expectedUpdatedAt: undefined,
    });
    await authenticatedRequest(superAdminToken, "mutate", publishAppearanceMutationDocument, {
      expectedUpdatedAt: undefined,
    });
    await authenticatedRequest(superAdminToken, "mutate", resetAppearanceDraftMutationDocument, {});
  });
});
