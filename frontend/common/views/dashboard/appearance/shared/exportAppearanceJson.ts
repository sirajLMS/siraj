"use client";

import type { AppearanceDraftInput } from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";

/**
 * Relative path to the canonical JSON Schema (Task 9.1).
 *
 * Embedded in every exported `appearance-settings.json` so editors (VS Code
 * JSON language server, JetBrains) auto-validate and offer property/enum
 * autocomplete when the file is opened inside the repo. The matching
 * `*appearance*.json` glob in `.vscode/settings.json` (Task 9.1) is the
 * fallback for files without a `$schema` field.
 *
 * Relative (not absolute) so the export resolves correctly regardless of
 * where the repo lives on disk.
 */
const APPEARANCE_SCHEMA_URL = "./shared/schemas/appearance.schema.json";

/**
 * Default filename for the exported JSON document.
 *
 * Matches the `*appearance*.json` glob registered in `.vscode/settings.json`
 * so opening the file inside the repo auto-activates the JSON Schema
 * association from Task 9.1 even if the `$schema` header is stripped.
 */
const APPEARANCE_EXPORT_FILENAME = "appearance-settings.json";

/**
 * Shape of the exported JSON document. Mirrors {@link AppearanceDraftInput}
 * (the codegen mutation input type, structurally identical to the canonical
 * `AppearanceFields` from `backend/types/appearance.types.ts`) plus a
 * `$schema` header that points editors to the canonical JSON Schema.
 *
 * `$schema` is declared first so it appears at the top of the
 * pretty-printed JSON output (editor UX convention).
 */
interface AppearanceSettingsJson {
  /** JSON Schema URL for editor autocompletion / validation (Task 9.1). */
  readonly $schema: string;
  readonly colors: AppearanceDraftInput["colors"];
  readonly logoUrl: string | null;
  readonly siteName: string;
  readonly siteTitle: string;
  readonly siteDescription: string;
  readonly defaultColorScheme: string;
}

/**
 * Build the JSON-exportable appearance document from the in-memory draft.
 *
 * - Coerces `logoUrl: undefined` to `null` (the schema accepts
 *   `["string","null"]`; `undefined` would be dropped by `JSON.stringify`,
 *   producing an invalid file per the schema's
 *   `required: ["logoUrl", ...]` constraint).
 * - Prepends a `$schema` header so VS Code (or any JSON-LD-aware editor)
 *   auto-validates the file against `shared/schemas/appearance.schema.json`
 *   on open (Task 9.1 wired the matching `*appearance*.json` glob in
 *   `.vscode/settings.json` as a fallback).
 *
 * Returns the pretty-printed JSON string (2-space indent, trailing newline)
 * for use as the `Blob` body in {@link exportAppearanceJson}. Exposed
 * separately so unit tests can assert the serialized shape without
 * triggering a browser download.
 */
function buildAppearanceSettingsJson(draft: AppearanceDraftInput): string {
  const document: AppearanceSettingsJson = {
    $schema: APPEARANCE_SCHEMA_URL,
    colors: draft.colors,
    logoUrl: draft.logoUrl ?? null,
    siteName: draft.siteName,
    siteTitle: draft.siteTitle,
    siteDescription: draft.siteDescription,
    defaultColorScheme: draft.defaultColorScheme,
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}

/**
 * Trigger a browser download of the current appearance draft as
 * `appearance-settings.json` (AC-28).
 *
 * Flow:
 *  1. Serialize the draft via {@link buildAppearanceSettingsJson} (includes
 *     `$schema` header + coerces `logoUrl: undefined` to `null`).
 *  2. Wrap in a `Blob` (`application/json;charset=utf-8` MIME — sets the
 *     `Content-Type` on the downloaded file so editors/OSes recognize it).
 *  3. Mint a temporary `objectURL` for the Blob.
 *  4. Create an invisible `<a download>` element, click it, then remove it.
 *  5. Revoke the `objectURL` to release memory.
 *
 * Guarded by `typeof document === "undefined"` so the function can be
 * imported in SSR / test contexts without throwing; in those environments
 * it logs a warning and returns early (no-op).
 *
 * @param draft the current appearance draft (per-mode colors, logo, site
 *   info) — typically sourced from `useAppearancePreviewStore(s => s.draft)`.
 */
export function exportAppearanceJson(draft: AppearanceDraftInput): void {
  if (typeof document === "undefined") {
    // SSR / test environment — the export button is client-only.
    logger.warn("exportAppearanceJson called outside the browser — no-op");
    return;
  }

  const json = buildAppearanceSettingsJson(draft);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = APPEARANCE_EXPORT_FILENAME;
  // Hidden from accessibility tree — the link is never keyboard-focused;
  // it exists only to receive a programmatic `click()` that triggers the
  // browser download dialog.
  link.setAttribute("aria-hidden", "true");
  link.rel = "noopener";
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Defer revocation by one macrotask so the click has time to start the
  // download (Safari 14+ requires this; Firefox/Chrome are lenient).
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
