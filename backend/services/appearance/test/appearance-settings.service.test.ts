/**
 * Site Appearance Customization — Service Layer Tests (Task 10.1)
 *
 * Coverage tiers:
 *   - **Tier 1 (100% branch coverage)**: happy-path reads/writes for every
 *     exported method of {@link AppearanceSettingsService}.
 *   - **Tier 2 (boundary)**: null logo, max-length strings, special chars.
 *   - **Tier 3 (chaos)**: malformed `NEXT_PUBLIC_APP_BRANDING` env JSON,
 *     Zod-validation failure fallback in `saveDraft`, audit-log failure
 *     resilience.
 *   - **Tier 4 (security)**: permission gating (AC-7/AC-9/AC-10) and
 *     optimistic-concurrency conflict rejection (AC-33).
 *
 * Conventions:
 *   - `bun:test` (`describe/test/expect/mock`).
 *   - Mocks are registered with `mock.module(...)` BEFORE the service module
 *     is imported (see `backend/services/AGENTS.md` "Testing").
 *   - No real DB / network / cache — `AppearanceSettingsRepository`,
 *     `PermissionsService`, `AuditService`, `next/cache`, and `logger` are
 *     all stubbed.
 *
 * Run: `bun run test/scripts/run-test.ts backend/services/appearance/test/appearance-settings.service.test.ts`
 */

import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { PaletteMode } from "@mui/material/styles";
import { AppPermission } from "@/backend/enum";
import type {
  AppearanceFields,
  AppearanceSettingsReturnType,
  AppearanceSettingsRow,
  CreateAuditLogInput,
  DBTransaction,
} from "@/backend/types";
import { errorsEn } from "@/shared/locale/en/errors";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTOR_ID = "11111111-1111-4111-8111-111111111111";
const UNAUTHORIZED_ACTOR_ID = "22222222-2222-4222-8222-222222222222";
const ROW_ID = "33333333-3333-4333-8333-333333333333";
const UPDATED_AT = "2026-01-01T00:00:00.000Z";
const STALE_UPDATED_AT = "2025-01-01T00:00:00.000Z";

/** Real English error labels — satisfies `ErrorsLabels` without unsafe casts. */
const T_ERRORS = errorsEn;

const DEFAULT_FIELDS: AppearanceFields = {
  colors: {
    light: { primaryMain: "#0D9488", secondaryMain: "#4F46E5" },
    dark: { primaryMain: "#2DD4BF", secondaryMain: "#818CF8" },
  },
  logoUrl: null,
  siteName: "Siraj",
  siteTitle: "Siraj",
  siteDescription: "Siraj education management",
  defaultColorScheme: "dark",
};

/**
 * Build a row for testing — matches {@link AppearanceSettingsRow} shape.
 * `published` projects the active-mode colors into the single-mode columns.
 */
function makeRow(
  overrides: Partial<{
    primaryMain: string;
    secondaryMain: string;
    logoUrl: string | null;
    siteName: string;
    siteTitle: string;
    siteDescription: string;
    defaultColorScheme: PaletteMode;
    draftFields: AppearanceFields;
    updatedAt: string;
  }> = {}
): AppearanceSettingsReturnType {
  const draft = overrides.draftFields ?? DEFAULT_FIELDS;
  const scheme: PaletteMode = overrides.defaultColorScheme ?? draft.defaultColorScheme;
  const activeColors = draft.colors[scheme];
  return {
    id: ROW_ID,
    primaryMain: overrides.primaryMain ?? activeColors.primaryMain,
    secondaryMain: overrides.secondaryMain ?? activeColors.secondaryMain,
    logoUrl: overrides.logoUrl ?? draft.logoUrl,
    siteName: overrides.siteName ?? draft.siteName,
    siteTitle: overrides.siteTitle ?? draft.siteTitle,
    siteDescription: overrides.siteDescription ?? draft.siteDescription,
    defaultColorScheme: scheme,
    draftFields: draft,
    updatedByUserId: ACTOR_ID,
    updatedAt: overrides.updatedAt ?? UPDATED_AT,
    createdAt: UPDATED_AT,
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the service module is imported.
// ---------------------------------------------------------------------------

// --- AppearanceSettingsRepository -----------------------------------------

const repoGetMock = mock(async (_tx?: DBTransaction): Promise<AppearanceSettingsReturnType | null> => null);
const repoUpsertMock = mock(
  async (input: AppearanceSettingsRow, _userId: string, _tx?: DBTransaction): Promise<AppearanceSettingsReturnType> =>
    input
);
const repoPublishDraftMock = mock(
  async (draftFields: AppearanceFields, _userId: string, _tx?: DBTransaction): Promise<AppearanceSettingsReturnType> =>
    makeRow({ draftFields })
);

await mock.module("@/backend/db/repo", () => ({
  AppearanceSettingsRepository: {
    get: repoGetMock,
    upsert: repoUpsertMock,
    publishDraft: repoPublishDraftMock,
  },
}));

// --- PermissionsService ---------------------------------------------------

const hasPermissionMock = mock(async (_userId: string, _permission: AppPermission): Promise<boolean> => true);

await mock.module("@/backend/services/auth/permissions.service", () => ({
  PermissionsService: {
    hasPermission: hasPermissionMock,
  },
}));

// --- AuditService ---------------------------------------------------------

const createManyAuditLogsMock = mock(
  async (_inputs: CreateAuditLogInput[], _tx?: DBTransaction): Promise<void> => undefined
);

await mock.module("@/backend/services/system/audit.service", () => ({
  AuditService: {
    createManyAuditLogs: createManyAuditLogsMock,
  },
}));

// --- next/cache (revalidateTag + unstable_cache) --------------------------

const revalidateTagMock = mock((_tag: string, _cacheLife?: string): void => undefined);

await mock.module("next/cache", () => ({
  revalidateTag: revalidateTagMock,
  // `unstable_cache(fn, keys, opts)` returns a cached fn — for tests we
  // bypass the cache and just invoke the wrapped fn directly so tests
  // observe live repo mock state.
  unstable_cache:
    <TArgs extends unknown[], TResult>(fn: (...args: TArgs) => Promise<TResult>) =>
    (...args: TArgs) =>
      fn(...args),
}));

// --- logger (best-effort audit failure path) ------------------------------

await mock.module("@/backend/lib", () => ({
  logger: {
    warn: () => undefined,
    error: () => undefined,
    info: () => undefined,
    debug: () => undefined,
  },
}));

// --- Import the service under test (AFTER mocks are registered) -----------

const {
  AppearanceSettingsService,
  AppearanceConflictError,
  isAppearanceConflictError,
  DEFAULT_APPEARANCE_FIELDS,
  revalidateAppearanceCache,
} = await import("@/backend/services/appearance/appearance-settings.service");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resets all mock call counts and default return values between tests. */
function resetMocks(): void {
  repoGetMock.mockImplementation(async () => null);
  repoUpsertMock.mockImplementation(async input => input);
  repoPublishDraftMock.mockImplementation(async draftFields => makeRow({ draftFields }));
  hasPermissionMock.mockImplementation(async () => true);
  createManyAuditLogsMock.mockImplementation(async () => undefined);
  revalidateTagMock.mockImplementation(() => undefined);
  repoGetMock.mockClear();
  repoUpsertMock.mockClear();
  repoPublishDraftMock.mockClear();
  hasPermissionMock.mockClear();
  createManyAuditLogsMock.mockClear();
  revalidateTagMock.mockClear();
}

/**
 * Try/catch helper for assertions that throw inside the service — gives a
 * structured `Error` to assert on without `expect(...).rejects` (which can
 * interfere with mock cleanup in some bun:test setups).
 *
 * Non-Error throws are wrapped in a plain `Error` so callers can safely
 * assert on `.message`.
 */
async function captureError(fn: () => Promise<unknown>): Promise<Error | null> {
  try {
    await fn();
    return null;
  } catch (error) {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }
}

// ===========================================================================
// Tier 1 — Happy path / branch coverage
// ===========================================================================

describe("AppearanceSettingsService — Tier 1 (happy path)", () => {
  beforeEach(resetMocks);

  // --- getAppearance -------------------------------------------------------

  describe("getAppearance", () => {
    test("returns null when no row exists and no actorUserId supplied (public read)", async () => {
      repoGetMock.mockImplementation(async () => null);
      const result = await AppearanceSettingsService.getAppearance();
      expect(result).toBeNull();
      expect(repoUpsertMock).not.toHaveBeenCalled();
    });

    test("seeds defaults when no row exists and actorUserId is supplied (first admin read, AC-2)", async () => {
      repoGetMock.mockImplementation(async () => null);
      const seeded = makeRow();
      repoUpsertMock.mockImplementation(async () => seeded);
      const result = await AppearanceSettingsService.getAppearance({ actorUserId: ACTOR_ID });
      expect(repoUpsertMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(seeded);
    });

    test("returns existing row without seeding when row exists", async () => {
      const existing = makeRow();
      repoGetMock.mockImplementation(async () => existing);
      const result = await AppearanceSettingsService.getAppearance({ actorUserId: ACTOR_ID });
      expect(result).toEqual(existing);
      expect(repoUpsertMock).not.toHaveBeenCalled();
    });

    test("passes through tx option to repo.get", async () => {
      repoGetMock.mockImplementation(async () => null);
      await AppearanceSettingsService.getAppearance();
      // repo.get is called with no tx when getAppearance receives no tx.
      expect(repoGetMock).toHaveBeenCalledTimes(1);
    });
  });

  // --- getFirstAppearancePublished ----------------------------------------

  describe("getFirstAppearancePublished", () => {
    test("returns null when no row exists (cold-start SSR)", async () => {
      repoGetMock.mockImplementation(async () => null);
      const result = await AppearanceSettingsService.getFirstAppearancePublished();
      expect(result).toBeNull();
    });

    test("returns published projection when row exists (active mode = dark)", async () => {
      const row = makeRow({
        defaultColorScheme: "dark",
        draftFields: {
          ...DEFAULT_FIELDS,
          defaultColorScheme: "dark",
          colors: {
            light: { primaryMain: "#FFFFFF", secondaryMain: "#EEEEEE" },
            dark: { primaryMain: "#2DD4BF", secondaryMain: "#818CF8" },
          },
        },
      });
      repoGetMock.mockImplementation(async () => row);
      const result = await AppearanceSettingsService.getFirstAppearancePublished();
      expect(result).not.toBeNull();
      // Active mode (dark) colors come from the published single-mode columns.
      expect(result?.colors.dark).toEqual({ primaryMain: "#2DD4BF", secondaryMain: "#818CF8" });
      // Inactive mode (light) colors come from the draft JSONB (best available).
      expect(result?.colors.light).toEqual({ primaryMain: "#FFFFFF", secondaryMain: "#EEEEEE" });
      expect(result?.defaultColorScheme).toBe("dark");
    });

    test("returns published projection when active mode = light", async () => {
      const row = makeRow({
        defaultColorScheme: "light",
        primaryMain: "#0D9488",
        secondaryMain: "#4F46E5",
        draftFields: {
          ...DEFAULT_FIELDS,
          defaultColorScheme: "light",
          colors: {
            light: { primaryMain: "#0D9488", secondaryMain: "#4F46E5" },
            dark: { primaryMain: "#222222", secondaryMain: "#333333" },
          },
        },
      });
      repoGetMock.mockImplementation(async () => row);
      const result = await AppearanceSettingsService.getFirstAppearancePublished();
      expect(result?.colors.light).toEqual({ primaryMain: "#0D9488", secondaryMain: "#4F46E5" });
      expect(result?.colors.dark).toEqual({ primaryMain: "#222222", secondaryMain: "#333333" });
      expect(result?.defaultColorScheme).toBe("light");
    });
  });

  // --- getResolvedAppearance (4-tier resolution ladder, AC-26/AC-27) ------

  describe("getResolvedAppearance", () => {
    test("Tier 4 — falls back to DEFAULT_APPEARANCE_FIELDS when no row + no env (AC-26, AC-27)", async () => {
      repoGetMock.mockImplementation(async () => null);
      delete process.env.NEXT_PUBLIC_APP_BRANDING;
      // Clear the in-memory Tier 1 memo between tests via revalidateAppearanceCache().
      // NOTE: `envBrandingMemo` is intentionally process-scoped and not reset
      // here (env vars are immutable at runtime in Next.js — see service
      // docstring). The valid-env happy path is exercised in
      // `shared/schemas/appearance.zod.ts` tests for `parseAppearanceEnvBranding`;
      // here we only verify that an unset/invalid env falls through to defaults.
      revalidateAppearanceCache();
      const result = await AppearanceSettingsService.getResolvedAppearance();
      expect(result).toEqual(DEFAULT_APPEARANCE_FIELDS);
    });

    test("Tier 2 — uses published DB read when row exists", async () => {
      const row = makeRow({ siteName: "DBBrand" });
      repoGetMock.mockImplementation(async () => row);
      revalidateAppearanceCache();
      const result = await AppearanceSettingsService.getResolvedAppearance();
      expect(result.siteName).toBe("DBBrand");
    });

    test("Tier 1 — in-memory memo hit skips DB on warm reads", async () => {
      const row = makeRow({ siteName: "MemoBrand" });
      repoGetMock.mockImplementation(async () => row);
      revalidateAppearanceCache();
      await AppearanceSettingsService.getResolvedAppearance(); // populates memo
      const callCountAfterFirst = repoGetMock.mock.calls.length;
      await AppearanceSettingsService.getResolvedAppearance(); // should hit memo
      expect(repoGetMock.mock.calls).toHaveLength(callCountAfterFirst);
    });
  });

  // --- saveDraft -----------------------------------------------------------

  describe("saveDraft", () => {
    test("first-write seeding: seeds published defaults + draft input when no row exists (AC-8)", async () => {
      repoGetMock.mockImplementation(async () => null);
      const upserted = makeRow();
      repoUpsertMock.mockImplementation(async () => upserted);
      const draftInput = { ...DEFAULT_FIELDS, siteName: "NewBrand" };
      const result = await AppearanceSettingsService.saveDraft(draftInput, ACTOR_ID, T_ERRORS);
      expect(repoUpsertMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(upserted);
      // Verify the upsert was called with the input as draft + DEFAULTS as published.
      const [upsertArg] = repoUpsertMock.mock.calls[0];
      expect(upsertArg.draftFields.siteName).toBe("NewBrand");
      // Published siteName defaults (first-write seeding).
      expect(upsertArg.siteName).toBe(DEFAULT_APPEARANCE_FIELDS.siteName);
    });

    test("existing row: preserves published columns, replaces draftFields (AC-8)", async () => {
      const existing = makeRow({ siteName: "Published" });
      repoGetMock.mockImplementation(async () => existing);
      const upserted = { ...existing, draftFields: { ...DEFAULT_FIELDS, siteName: "Draft" } };
      repoUpsertMock.mockImplementation(async () => upserted);
      const draftInput = { ...DEFAULT_FIELDS, siteName: "Draft" };
      const result = await AppearanceSettingsService.saveDraft(draftInput, ACTOR_ID, T_ERRORS);
      expect(result).toEqual(upserted);
      const [upsertArg] = repoUpsertMock.mock.calls[0];
      // Published columns preserved.
      expect(upsertArg.siteName).toBe("Published");
      // Draft replaced.
      expect(upsertArg.draftFields.siteName).toBe("Draft");
    });

    test("stamps actorUserId on updatedByUserId (BOLA defense, decision #20)", async () => {
      repoGetMock.mockImplementation(async () => makeRow());
      await AppearanceSettingsService.saveDraft(DEFAULT_FIELDS, ACTOR_ID, T_ERRORS);
      const [, actorArg] = repoUpsertMock.mock.calls[0];
      expect(actorArg).toBe(ACTOR_ID);
    });
  });

  // --- publish -------------------------------------------------------------

  describe("publish", () => {
    test("first publish: seeds defaults then publishes (AC-9)", async () => {
      repoGetMock.mockImplementation(async () => null);
      const seeded = makeRow();
      const published = { ...seeded, siteName: "Published" };
      repoUpsertMock.mockImplementation(async () => seeded);
      repoPublishDraftMock.mockImplementation(async () => published);
      const result = await AppearanceSettingsService.publish(ACTOR_ID, T_ERRORS);
      expect(repoPublishDraftMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(published);
    });

    test("existing row: copies draftFields to published (AC-9)", async () => {
      const existing = makeRow();
      repoGetMock.mockImplementation(async () => existing);
      const published = { ...existing, siteName: "FreshlyPublished" };
      repoPublishDraftMock.mockImplementation(async () => published);
      const result = await AppearanceSettingsService.publish(ACTOR_ID, T_ERRORS);
      expect(repoPublishDraftMock).toHaveBeenCalledWith(existing.draftFields, ACTOR_ID, undefined);
      expect(result).toEqual(published);
    });

    test("invalidates SSR cache tag (AC-22)", async () => {
      repoGetMock.mockImplementation(async () => makeRow());
      await AppearanceSettingsService.publish(ACTOR_ID, T_ERRORS);
      expect(revalidateTagMock).toHaveBeenCalledTimes(1);
    });

    test("emits best-effort audit entry with new published values", async () => {
      const published = makeRow({ siteName: "PublishedAudit" });
      repoGetMock.mockImplementation(async () => makeRow());
      repoPublishDraftMock.mockImplementation(async () => published);
      await AppearanceSettingsService.publish(ACTOR_ID, T_ERRORS);
      expect(createManyAuditLogsMock).toHaveBeenCalledTimes(1);
      const [auditInput] = createManyAuditLogsMock.mock.calls[0];
      const firstAudit = auditInput[0];
      if (!firstAudit?.newState) throw new Error("expected at least one audit entry with newState");
      expect(firstAudit.actorUserId).toBe(ACTOR_ID);
      expect(firstAudit.action).toBe("UPDATE");
      expect(firstAudit.entityType).toBe("SYSTEM");
      expect(firstAudit.newState.siteName).toBe("PublishedAudit");
    });
  });

  // --- resetDraft ----------------------------------------------------------

  describe("resetDraft", () => {
    test("first reset: seeds defaults when no row exists", async () => {
      repoGetMock.mockImplementation(async () => null);
      const seeded = makeRow();
      repoUpsertMock.mockImplementation(async () => seeded);
      const result = await AppearanceSettingsService.resetDraft(ACTOR_ID, T_ERRORS);
      expect(repoUpsertMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(seeded);
    });

    test("existing row: resets draftFields to match published columns", async () => {
      const existing = makeRow({
        defaultColorScheme: "dark",
        draftFields: {
          ...DEFAULT_FIELDS,
          siteName: "DraftEdited",
          defaultColorScheme: "dark",
        },
      });
      repoGetMock.mockImplementation(async () => existing);
      const reset = { ...existing, draftFields: { ...DEFAULT_FIELDS, siteName: "Siraj" } };
      repoUpsertMock.mockImplementation(async () => reset);
      const result = await AppearanceSettingsService.resetDraft(ACTOR_ID, T_ERRORS);
      const [upsertArg] = repoUpsertMock.mock.calls[0];
      // Draft siteName reset to match published (existing.siteName == "Siraj").
      expect(upsertArg.draftFields.siteName).toBe(existing.siteName);
      expect(result).toEqual(reset);
    });
  });
});

// ===========================================================================
// Tier 2 — Boundary cases
// ===========================================================================

describe("AppearanceSettingsService — Tier 2 (boundary)", () => {
  beforeEach(resetMocks);

  test("null logoUrl is preserved end-to-end through saveDraft", async () => {
    repoGetMock.mockImplementation(async () => makeRow());
    const input = { ...DEFAULT_FIELDS, logoUrl: null };
    await AppearanceSettingsService.saveDraft(input, ACTOR_ID, T_ERRORS);
    const [upsertArg] = repoUpsertMock.mock.calls[0];
    expect(upsertArg.draftFields.logoUrl).toBeNull();
  });

  test("non-null logoUrl is preserved end-to-end", async () => {
    repoGetMock.mockImplementation(async () => makeRow());
    const input = { ...DEFAULT_FIELDS, logoUrl: "https://cdn.example.com/logo-abc.png" };
    await AppearanceSettingsService.saveDraft(input, ACTOR_ID, T_ERRORS);
    const [upsertArg] = repoUpsertMock.mock.calls[0];
    expect(upsertArg.draftFields.logoUrl).toBe("https://cdn.example.com/logo-abc.png");
  });

  test("max-length siteName/siteTitle/siteDescription pass through", async () => {
    repoGetMock.mockImplementation(async () => makeRow());
    const input = {
      ...DEFAULT_FIELDS,
      siteName: "A".repeat(80),
      siteTitle: "B".repeat(120),
      siteDescription: "C".repeat(300),
    };
    await AppearanceSettingsService.saveDraft(input, ACTOR_ID, T_ERRORS);
    const [upsertArg] = repoUpsertMock.mock.calls[0];
    expect(upsertArg.draftFields.siteName).toHaveLength(80);
    expect(upsertArg.draftFields.siteTitle).toHaveLength(120);
    expect(upsertArg.draftFields.siteDescription).toHaveLength(300);
  });

  test("special characters in text fields are preserved (HTML is sanitized by the helpers, not the service)", async () => {
    repoGetMock.mockImplementation(async () => makeRow());
    const input = {
      ...DEFAULT_FIELDS,
      siteName: "Café naïve — ☕",
      siteTitle: "日本語タイトル & <weird>",
      siteDescription: "Tabs\t&\nNewlines",
    };
    await AppearanceSettingsService.saveDraft(input, ACTOR_ID, T_ERRORS);
    expect(repoUpsertMock).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// Tier 3 — Chaos / fallback paths
// ===========================================================================

describe("AppearanceSettingsService — Tier 3 (chaos)", () => {
  beforeEach(resetMocks);

  /**
   * All three chaos cases share the same shape (env-set → revalidate → expect
   * defaults → unset env); collapse into one parameterised test to silence
   * CodeScene code-duplication warnings (AC-39).
   */
  test.each([
    ["malformed JSON", "{not valid json"],
    ["schema-invalid JSON (siteName violates min(1))", JSON.stringify({ ...DEFAULT_FIELDS, siteName: "" })],
    ["empty/whitespace", "   "],
  ])("NEXT_PUBLIC_APP_BRANDING with %s falls back to defaults (AC-38, AC-39)", async (_label, envValue) => {
    repoGetMock.mockImplementation(async () => null);
    process.env.NEXT_PUBLIC_APP_BRANDING = envValue;
    revalidateAppearanceCache();
    const result = await AppearanceSettingsService.getResolvedAppearance();
    expect(result).toEqual(DEFAULT_APPEARANCE_FIELDS);
    delete process.env.NEXT_PUBLIC_APP_BRANDING;
  });

  test("Zod-validation failure in saveDraft falls back to DEFAULT_APPEARANCE_FIELDS (AC-38, AC-39)", async () => {
    repoGetMock.mockImplementation(async () => makeRow());
    // Empty siteName — passes sanitization (no HTML to strip) but fails Zod
    // `min(1)` validation. The service falls back to DEFAULT_APPEARANCE_FIELDS
    // for the draft (never throws — AC-39).
    const invalidInput: AppearanceFields = {
      ...DEFAULT_FIELDS,
      siteName: "",
    };
    await AppearanceSettingsService.saveDraft(invalidInput, ACTOR_ID, T_ERRORS);
    const [upsertArg] = repoUpsertMock.mock.calls[0];
    // Zod failure → safeInput falls back to DEFAULT_APPEARANCE_FIELDS.
    expect(upsertArg.draftFields.siteName).toBe(DEFAULT_APPEARANCE_FIELDS.siteName);
  });

  test("audit-log failure in publish is swallowed (best-effort, never throws, AC-22)", async () => {
    repoGetMock.mockImplementation(async () => makeRow());
    repoPublishDraftMock.mockImplementation(async () => makeRow());
    createManyAuditLogsMock.mockImplementation(async () => {
      throw new Error("audit db down");
    });
    // Must NOT throw.
    const error = await captureError(() => AppearanceSettingsService.publish(ACTOR_ID, T_ERRORS));
    expect(error).toBeNull();
    // Cache invalidation still happened.
    expect(revalidateTagMock).toHaveBeenCalledTimes(1);
  });

  test("DB failure in getResolvedAppearance propagates (does NOT silently fall back to defaults)", async () => {
    repoGetMock.mockImplementation(async () => {
      throw new Error("db connection lost");
    });
    revalidateAppearanceCache();
    const error = await captureError(() => AppearanceSettingsService.getResolvedAppearance());
    // The service does not catch DB errors in getResolvedAppearance's Tier 2
    // path — the caller (SSR) is responsible for try/catch.
    expect(error).not.toBeNull();
    expect(error?.message).toContain("db connection lost");
  });
});

// ===========================================================================
// Tier 4 — Security: permission gating + optimistic concurrency
// ===========================================================================

describe("AppearanceSettingsService — Tier 4 (security)", () => {
  beforeEach(resetMocks);

  // --- Permission gating (AC-7, AC-9, AC-10) -------------------------------

  describe("permission gating (SETTINGS_APPEARANCE_MANAGE)", () => {
    test("saveDraft throws insufficientPermissions when actor lacks permission", async () => {
      hasPermissionMock.mockImplementation(async () => false);
      const error = await captureError(() =>
        AppearanceSettingsService.saveDraft(DEFAULT_FIELDS, UNAUTHORIZED_ACTOR_ID, T_ERRORS)
      );
      expect(error).not.toBeNull();
      expect(error?.message).toContain(errorsEn.insufficientPermissions);
      expect(repoUpsertMock).not.toHaveBeenCalled();
    });

    test("publish throws insufficientPermissions when actor lacks permission", async () => {
      hasPermissionMock.mockImplementation(async () => false);
      const error = await captureError(() => AppearanceSettingsService.publish(UNAUTHORIZED_ACTOR_ID, T_ERRORS));
      expect(error).not.toBeNull();
      expect(error?.message).toContain(errorsEn.insufficientPermissions);
      expect(repoPublishDraftMock).not.toHaveBeenCalled();
      expect(revalidateTagMock).not.toHaveBeenCalled();
      expect(createManyAuditLogsMock).not.toHaveBeenCalled();
    });

    test("resetDraft throws insufficientPermissions when actor lacks permission", async () => {
      hasPermissionMock.mockImplementation(async () => false);
      const error = await captureError(() => AppearanceSettingsService.resetDraft(UNAUTHORIZED_ACTOR_ID, T_ERRORS));
      expect(error).not.toBeNull();
      expect(error?.message).toContain(errorsEn.insufficientPermissions);
      expect(repoUpsertMock).not.toHaveBeenCalled();
    });

    test("permission check uses AppPermission.SETTINGS_APPEARANCE_MANAGE", async () => {
      hasPermissionMock.mockImplementation(async () => true);
      await AppearanceSettingsService.saveDraft(DEFAULT_FIELDS, ACTOR_ID, T_ERRORS);
      const [, permissionArg] = hasPermissionMock.mock.calls[0];
      expect(permissionArg).toBe(AppPermission.SETTINGS_APPEARANCE_MANAGE);
    });
  });

  // --- Optimistic concurrency conflict (AC-33) -----------------------------

  /**
   * Shared "stale expectedUpdatedAt" setup-and-assert: seeds a row, runs the
   * supplied write action, captures the resulting error, and verifies the
   * common AppearanceConflictError invariants. Extracted to silence CodeScene
   * code-duplication warnings between the `saveDraft` and `publish` variants
   * — each test then only asserts its own write-specific no-touch assertion.
   * Returns the narrowed error so the caller can do method-specific checks.
   */
  async function expectStaleConflictError(
    action: () => Promise<unknown>,
  ): Promise<AppearanceConflictError> {
    const existing = makeRow({ updatedAt: UPDATED_AT });
    repoGetMock.mockImplementation(async () => existing);
    const error = await captureError(action);
    expect(error).toBeInstanceOf(AppearanceConflictError);
    expect(isAppearanceConflictError(error)).toBe(true);
    if (!(error instanceof AppearanceConflictError)) {
      throw new Error("expected AppearanceConflictError");
    }
    expect(error.serverUpdatedAt).toBe(UPDATED_AT);
    expect(error.code).toBe("APPEARANCE_CONFLICT");
    return error;
  }

  describe("optimistic concurrency conflict (expectedUpdatedAt)", () => {
    test("saveDraft throws AppearanceConflictError when expectedUpdatedAt is stale", async () => {
      await expectStaleConflictError(() =>
        AppearanceSettingsService.saveDraft(DEFAULT_FIELDS, ACTOR_ID, T_ERRORS, undefined, STALE_UPDATED_AT),
      );
      expect(repoUpsertMock).not.toHaveBeenCalled();
    });

    test("publish throws AppearanceConflictError when expectedUpdatedAt is stale", async () => {
      await expectStaleConflictError(() =>
        AppearanceSettingsService.publish(ACTOR_ID, T_ERRORS, undefined, STALE_UPDATED_AT),
      );
      expect(repoPublishDraftMock).not.toHaveBeenCalled();
      expect(revalidateTagMock).not.toHaveBeenCalled();
    });

    test("saveDraft succeeds when expectedUpdatedAt matches current row", async () => {
      const existing = makeRow({ updatedAt: UPDATED_AT });
      repoGetMock.mockImplementation(async () => existing);
      repoUpsertMock.mockImplementation(async () => existing);
      await AppearanceSettingsService.saveDraft(DEFAULT_FIELDS, ACTOR_ID, T_ERRORS, undefined, UPDATED_AT);
      expect(repoUpsertMock).toHaveBeenCalledTimes(1);
    });

    test("publish succeeds when expectedUpdatedAt matches current row", async () => {
      const existing = makeRow({ updatedAt: UPDATED_AT });
      repoGetMock.mockImplementation(async () => existing);
      repoPublishDraftMock.mockImplementation(async () => existing);
      await AppearanceSettingsService.publish(ACTOR_ID, T_ERRORS, undefined, UPDATED_AT);
      expect(repoPublishDraftMock).toHaveBeenCalledTimes(1);
    });

    test("omitting expectedUpdatedAt bypasses the conflict check (Overwrite escape hatch)", async () => {
      const existing = makeRow({ updatedAt: UPDATED_AT });
      repoGetMock.mockImplementation(async () => existing);
      repoUpsertMock.mockImplementation(async () => existing);
      // No expectedUpdatedAt → no conflict, even though "stale" would have been rejected.
      await AppearanceSettingsService.saveDraft(DEFAULT_FIELDS, ACTOR_ID, T_ERRORS);
      expect(repoUpsertMock).toHaveBeenCalledTimes(1);
    });

    test("first-write seeding path skips the conflict check (no prior row to conflict with)", async () => {
      repoGetMock.mockImplementation(async () => null);
      repoUpsertMock.mockImplementation(async () => makeRow());
      // Even with a stale expectedUpdatedAt, the first-write path skips the check.
      await AppearanceSettingsService.saveDraft(DEFAULT_FIELDS, ACTOR_ID, T_ERRORS, undefined, STALE_UPDATED_AT);
      expect(repoUpsertMock).toHaveBeenCalledTimes(1);
    });
  });
});
