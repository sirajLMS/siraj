import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { AppearanceSettingsRepository } from "@/backend/db/repo/appearance";
import { appearanceSettings } from "@/backend/db/schema";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import type { AppearanceFields, AppearanceSettingsRow, DBTransaction } from "@/backend/types";

/**
 * Tier 1 + Tier 2 tests for {@link AppearanceSettingsRepository}.
 *
 * Tier 1 (100% line coverage): `get` / `upsert` / `publishDraft` — both the
 * INSERT and UPDATE branches of `writeAppearanceRow`, plus the `null` and
 * `row` branches of `get` / `toAppearanceSettingsRow`.
 *
 * Tier 2 (boundary cases): null logo, non-null logo URL, max-length strings
 * per JSON Schema (Task 9.1: siteName 80 / siteTitle 120 / siteDescription
 * 300), special characters (emoji + Arabic + HTML-like tags + control chars),
 * and the active-mode color selection in `publishDraft` (light vs. dark).
 *
 * All tests run inside `runInRollback` so the dev `appearance_settings` row
 * is never mutated. The single-row table is cleared at the start of each
 * test via `clearAppearanceRow` to guarantee isolation regardless of any
 * pre-existing seed row (per `backend/db/test/AGENTS.md` §12 + §15).
 *
 * Run: `bun run test/scripts/run-test.ts backend/db/test/appearance/appearance-settings.repository.test.ts`
 */

/**
 * Clears the single-row `appearance_settings` table inside a rolled-back tx.
 *
 * The `.where(sql\`TRUE\`)` is an explicit "delete all rows" marker — required
 * by the `drizzle/enforce-delete-with-where` oxlint rule. The full-table
 * delete is intentional: `appearance_settings` is a single global row, and
 * each test must start from a known empty state regardless of any seed row
 * committed to the dev `siraj_test` DB by prior tasks (per
 * `backend/db/test/AGENTS.md` §12 + §15). The rollback guarantees the
 * committed seed (if any) is restored after the test.
 */
async function clearAppearanceRow(tx: DBTransaction): Promise<void> {
  await tx.delete(appearanceSettings).where(sql`TRUE`);
}

/** Builds an `AppearanceFields` draft with optional overrides. */
function buildDraft(overrides: Partial<AppearanceFields> = {}): AppearanceFields {
  return {
    colors: {
      light: { primaryMain: "#0D9488", secondaryMain: "#4F46E5" },
      dark: { primaryMain: "#2DD4BF", secondaryMain: "#818CF8" },
    },
    logoUrl: null,
    siteName: "Siraj",
    siteTitle: "Siraj",
    siteDescription: "Siraj education management",
    defaultColorScheme: "dark",
    ...overrides,
  };
}

/** Builds an `AppearanceSettingsRow` from a draft (for `upsert` input). */
function buildRow(draft: AppearanceFields): AppearanceSettingsRow {
  const activeColors = draft.colors[draft.defaultColorScheme];
  return {
    id: randomUUID(),
    primaryMain: activeColors.primaryMain,
    secondaryMain: activeColors.secondaryMain,
    logoUrl: draft.logoUrl,
    siteName: draft.siteName,
    siteTitle: draft.siteTitle,
    siteDescription: draft.siteDescription,
    defaultColorScheme: draft.defaultColorScheme,
    draftFields: draft,
    updatedByUserId: null,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

describe("AppearanceSettingsRepository — Tier 1 (100% line coverage)", () => {
  test("get() returns null when the table is empty (null branch)", async () => {
    await runInRollback(async tx => {
      await clearAppearanceRow(tx);
      const row = await AppearanceSettingsRepository.get(tx);
      expect(row).toBeNull();
    });
  });

  test("upsert() inserts a new row when none exists (INSERT branch)", async () => {
    await runInRollback(async tx => {
      await clearAppearanceRow(tx);
      const user = await createTestUser(tx);
      const draft = buildDraft();
      const created = await AppearanceSettingsRepository.upsert(buildRow(draft), user.id, tx);

      expect(created.id).toBeDefined();
      // active mode = dark -> dark colors copied into published columns
      expect(created.primaryMain).toBe("#2DD4BF");
      expect(created.secondaryMain).toBe("#818CF8");
      expect(created.logoUrl).toBeNull();
      expect(created.siteName).toBe("Siraj");
      expect(created.siteTitle).toBe("Siraj");
      expect(created.siteDescription).toBe("Siraj education management");
      expect(created.defaultColorScheme).toBe("dark");
      expect(created.draftFields).toEqual(draft);
      expect(created.updatedByUserId).toBe(user.id);
      expect(typeof created.updatedAt).toBe("string");
      expect(typeof created.createdAt).toBe("string");
    });
  });

  test("upsert() updates an existing row preserving the row id (UPDATE branch)", async () => {
    await runInRollback(async tx => {
      await clearAppearanceRow(tx);
      const user = await createTestUser(tx);
      const initial = await AppearanceSettingsRepository.upsert(buildRow(buildDraft()), user.id, tx);
      await new Promise(resolve => setTimeout(resolve, 5));

      const updatedDraft = buildDraft({
        siteName: "Updated Brand",
        siteTitle: "Updated Title",
        defaultColorScheme: "light",
      });
      const updated = await AppearanceSettingsRepository.upsert(buildRow(updatedDraft), user.id, tx);

      expect(updated.id).toBe(initial.id); // UPDATE preserves the row id
      expect(updated.siteName).toBe("Updated Brand");
      expect(updated.siteTitle).toBe("Updated Title");
      expect(updated.defaultColorScheme).toBe("light");
      expect(updated.draftFields.siteName).toBe("Updated Brand");
      // upsert writes BOTH published + draft from input — published primaryMain
      // comes from input.primaryMain (the explicit row field), NOT recomputed
      // from draftFields.colors (that recompute is publishDraft's job).
      expect(updated.updatedByUserId).toBe(user.id);
      expect(updated.updatedAt).not.toBe(initial.updatedAt); // repo stamps new Date()
    });
  });

  test("get() returns the row after upsert (row branch of toAppearanceSettingsRow)", async () => {
    await runInRollback(async tx => {
      await clearAppearanceRow(tx);
      const user = await createTestUser(tx);
      const draft = buildDraft({ siteName: "Tier1 Get" });
      const created = await AppearanceSettingsRepository.upsert(buildRow(draft), user.id, tx);

      const fetched = await AppearanceSettingsRepository.get(tx);
      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(created.id);
      expect(fetched?.siteName).toBe("Tier1 Get");
      expect(fetched?.draftFields).toEqual(draft);
      // ISO-string timestamp conversion (Date -> string) at the repo boundary
      expect(typeof fetched?.updatedAt).toBe("string");
      expect(typeof fetched?.createdAt).toBe("string");
    });
  });

  test("publishDraft() copies draft active-mode colors into published columns (INSERT path)", async () => {
    await runInRollback(async tx => {
      await clearAppearanceRow(tx);
      const user = await createTestUser(tx);

      const draft: AppearanceFields = buildDraft({
        colors: {
          light: { primaryMain: "#FF0000", secondaryMain: "#00FF00" },
          dark: { primaryMain: "#AA0000", secondaryMain: "#00AA00" },
        },
        logoUrl: "https://cdn.example.com/logo.png",
        siteName: "PublishTest",
        siteTitle: "PublishTest Title",
        siteDescription: "PublishTest Description",
        defaultColorScheme: "light", // active mode = light
      });

      const published = await AppearanceSettingsRepository.publishDraft(draft, user.id, tx);

      // active-mode (light) colors copied into published columns
      expect(published.primaryMain).toBe("#FF0000");
      expect(published.secondaryMain).toBe("#00FF00");
      expect(published.logoUrl).toBe("https://cdn.example.com/logo.png");
      expect(published.siteName).toBe("PublishTest");
      expect(published.siteTitle).toBe("PublishTest Title");
      expect(published.siteDescription).toBe("PublishTest Description");
      expect(published.defaultColorScheme).toBe("light");
      expect(published.draftFields).toEqual(draft);
      expect(published.updatedByUserId).toBe(user.id);
    });
  });
});

describe("AppearanceSettingsRepository — Tier 2 (boundary cases)", () => {
  /**
   * Shared seed+fetch helper for Tier 2 boundary roundtrips. Returns the
   * `upsert`-returned row AND a fresh `get()`-fetched row so each test can
   * assert on either without repeating the clear → user → draft → upsert →
   * fetch boilerplate (CodeScene code-duplication elimination per
   * `backend/db/test/AGENTS.md` §13).
   */
  async function seedAndFetch(
    tx: DBTransaction,
    overrides: Partial<AppearanceFields> = {}
  ): Promise<{ created: AppearanceSettingsRow; fetched: AppearanceSettingsRow | null }> {
    await clearAppearanceRow(tx);
    const user = await createTestUser(tx);
    const draft = buildDraft(overrides);
    const created = await AppearanceSettingsRepository.upsert(buildRow(draft), user.id, tx);
    const fetched = await AppearanceSettingsRepository.get(tx);
    return { created, fetched };
  }

  test("upsert() and get() roundtrip a null logo (logoUrl column is nullable)", async () => {
    await runInRollback(async tx => {
      const { created, fetched } = await seedAndFetch(tx, { logoUrl: null });
      expect(created.logoUrl).toBeNull();
      expect(fetched?.logoUrl).toBeNull();
      expect(fetched?.draftFields.logoUrl).toBeNull();
    });
  });

  test("upsert() and get() roundtrip a non-null logo URL", async () => {
    await runInRollback(async tx => {
      const logoUrl = "https://cdn.example.com/appearance/logo-abc123.png";
      const { created, fetched } = await seedAndFetch(tx, { logoUrl });
      expect(created.logoUrl).toBe(logoUrl);
      expect(fetched?.logoUrl).toBe(logoUrl);
      expect(fetched?.draftFields.logoUrl).toBe(logoUrl);
    });
  });

  test("upsert() persists maximum-length strings (siteName 80 / siteTitle 120 / siteDescription 300)", async () => {
    await runInRollback(async tx => {
      const longSiteName = "A".repeat(80);
      const longSiteTitle = "B".repeat(120);
      const longSiteDescription = "C".repeat(300);
      const { created, fetched } = await seedAndFetch(tx, {
        siteName: longSiteName,
        siteTitle: longSiteTitle,
        siteDescription: longSiteDescription,
      });
      expect(created.siteName).toHaveLength(80);
      expect(created.siteTitle).toHaveLength(120);
      expect(created.siteDescription).toHaveLength(300);
      expect(fetched?.siteName).toBe(longSiteName);
      expect(fetched?.siteTitle).toBe(longSiteTitle);
      expect(fetched?.siteDescription).toBe(longSiteDescription);
      expect(fetched?.draftFields.siteDescription).toBe(longSiteDescription);
    });
  });

  test("upsert() preserves special characters (emoji, Arabic RTL, HTML-like tags, newlines, tabs)", async () => {
    await runInRollback(async tx => {
      const special = "🚀 أكاديمية <script>alert('xss')</script>\nNewline\tTab";
      const { created, fetched } = await seedAndFetch(tx, {
        siteName: special,
        siteTitle: special,
        siteDescription: special,
      });
      expect(created.siteName).toBe(special);
      expect(created.siteTitle).toBe(special);
      expect(created.siteDescription).toBe(special);
      expect(fetched?.siteName).toBe(special);
      expect(fetched?.draftFields.siteName).toBe(special);
      // JSONB roundtrip preserves the tag-like string verbatim — the repo does
      // not sanitize (sanitization is the service layer's job, per Task 9.8).
    });
  });

  test("publishDraft() copies dark-mode colors when defaultColorScheme=dark", async () => {
    await runInRollback(async tx => {
      await clearAppearanceRow(tx);
      const user = await createTestUser(tx);
      const draft = buildDraft({
        colors: {
          light: { primaryMain: "#111111", secondaryMain: "#222222" },
          dark: { primaryMain: "#333333", secondaryMain: "#444444" },
        },
        defaultColorScheme: "dark",
      });
      const published = await AppearanceSettingsRepository.publishDraft(draft, user.id, tx);
      // active mode = dark -> dark colors copied into published columns
      expect(published.primaryMain).toBe("#333333");
      expect(published.secondaryMain).toBe("#444444");
    });
  });

  test("publishDraft() on an existing row updates in place (no duplicate row inserted)", async () => {
    await runInRollback(async tx => {
      await clearAppearanceRow(tx);
      const user = await createTestUser(tx);
      const first = await AppearanceSettingsRepository.publishDraft(buildDraft(), user.id, tx);
      const second = await AppearanceSettingsRepository.publishDraft(buildDraft({ siteName: "Second" }), user.id, tx);
      expect(second.id).toBe(first.id); // UPDATE preserves id, no duplicate
      const allRows = await tx.select().from(appearanceSettings);
      expect(allRows).toHaveLength(1);
      expect(second.siteName).toBe("Second");
    });
  });
});
