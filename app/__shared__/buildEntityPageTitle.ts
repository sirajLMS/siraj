import type { Metadata } from "next";

import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

type Translations = ReturnType<typeof getTranslations>;

/**
 * Build a static page title Metadata object from a translation selector.
 * Use for routes that don't need the entity ID or a fetched entity name.
 *
 * @param selector — Extracts a string title from the translations root
 *   (e.g. `t => t.dashboardTranslations.classAudit.pageTitle`).
 */
export async function buildTranslatedMetadata(selector: (t: Translations) => string): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale);
  return { title: selector(t) };
}

/**
 * Build a page title Metadata object that appends the entity ID after an
 * em-dash separator (e.g. "Edit Quota — abc123").
 *
 * @param title — The translated title string.
 * @param id — The entity ID from route params.
 */
export function buildIdSuffixedMetadata(title: string, id: string): Metadata {
  return { title: `${title} — ${id}` };
}

/**
 * Async variant: looks up the translated title then appends the entity ID.
 * Combines `buildTranslatedMetadata` + `buildIdSuffixedMetadata` so the
 * caller doesn't need to import `getLocale`/`getTranslations` directly.
 *
 * @param selector — Extracts a string title from the translations root.
 * @param id — The entity ID from route params.
 */
export async function buildIdSuffixedTranslatedMetadata(
  selector: (t: Translations) => string,
  id: string
): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale);
  return buildIdSuffixedMetadata(selector(t), id);
}

/**
 * Build a page title Metadata object that optionally prefixes a fetched
 * entity name before the translated title (e.g. "Ahmed — Weekly Schedule").
 *
 * When the entity name is available the format is `${entityName} — ${title}`;
 * when it is null/empty the title alone is returned.
 *
 * @param entityName — The fetched entity name (or null).
 * @param title — The translated title string used as fallback and suffix.
 */
export function buildEntityNamePrefixedMetadata(entityName: string | null, title: string): Metadata {
  if (entityName) {
    return { title: `${entityName} — ${title}` };
  }
  return { title };
}

/**
 * Async: looks up a translated title, then optionally prefixes the fetched
 * entity name (e.g. "Ahmed — Weekly Schedule"). When the entity name is
 * null/empty, the title alone is used.
 *
 * @param fetchEntityName — Async function that returns the entity name (or null).
 * @param titleSelector — Extracts the title string from translations.
 */
export async function buildEntityNamePrefixedTranslatedMetadata(
  fetchEntityName: () => Promise<string | null>,
  titleSelector: (t: Translations) => string
): Promise<Metadata> {
  const [entityName, titleMetadata] = await Promise.all([fetchEntityName(), buildTranslatedMetadata(titleSelector)]);
  const title = titleMetadata.title;
  return buildEntityNamePrefixedMetadata(entityName, typeof title === "string" ? title : "");
}

/**
 * Build a page title Metadata object that uses the fetched entity name
 * as the sole title when available, falling back to a translated title.
 *
 * @param entityName — The fetched entity name (or null).
 * @param fallbackTitle — The translated title used when entityName is null.
 */
export function buildEntityNameOnlyMetadata(entityName: string | null, fallbackTitle: string): Metadata {
  if (entityName) {
    return { title: entityName };
  }
  return { title: fallbackTitle };
}

/**
 * Async: looks up a translated fallback title, then uses the fetched
 * entity name as the sole title when available (else the fallback).
 *
 * @param fetchEntityName — Async function that returns the entity name (or null).
 * @param fallbackSelector — Extracts the fallback title from translations.
 */
export async function buildEntityNameOnlyTranslatedMetadata(
  fetchEntityName: () => Promise<string | null>,
  fallbackSelector: (t: Translations) => string
): Promise<Metadata> {
  const [entityName, titleMetadata] = await Promise.all([fetchEntityName(), buildTranslatedMetadata(fallbackSelector)]);
  const title = titleMetadata.title;
  return buildEntityNameOnlyMetadata(entityName, typeof title === "string" ? title : "");
}

/**
 * Build a page title Metadata object using a formatting function that
 * receives the entity name (e.g. `t.pageTitle(name)` which interpolates).
 *
 * When the entity name is available, `formatTitle(entityName)` is used.
 * When the entity name is null/empty:
 * - If `fallbackTitle` is provided, it is used directly.
 * - Otherwise, `formatTitle("")` is used (to match the existing fallback
 *   behavior of calling the format function with an empty string).
 *
 * @param entityName — The fetched entity name (or null).
 * @param formatTitle — A function that accepts the entity name and returns
 *   the formatted title string.
 * @param fallbackTitle — Optional translated title used when entityName is
 *   null/empty (when different from `formatTitle("")`).
 */
export function buildEntityNameFormattedMetadata(
  entityName: string | null,
  formatTitle: (name: string) => string,
  fallbackTitle?: string
): Metadata {
  if (entityName) {
    return { title: formatTitle(entityName) };
  }
  return { title: fallbackTitle ?? formatTitle("") };
}

/**
 * Async: fetches the entity name, then calls a formatting function that
 * receives the translations root and the entity name (e.g.
 * `t.pageTitle(name)` which interpolates).
 *
 * When the entity name is available, `formatTitle(t, entityName)` is used.
 * When the entity name is null:
 * - If `fallbackSelector` is provided, `fallbackSelector(t)` is used directly.
 * - Otherwise, `formatTitle(t, "")` is used (matching the existing fallback
 *   behavior of calling the format function with an empty string).
 *
 * @param fetchEntityName — Async function that returns the entity name (or null).
 * @param formatTitle — A function that accepts the translations root and the
 *   entity name and returns the formatted title string.
 * @param fallbackSelector — Optional selector for the fallback title used
 *   when entityName is null/empty (when different from `formatTitle(t, "")`).
 */
export async function buildEntityNameFormattedTranslatedMetadata(
  fetchEntityName: () => Promise<string | null>,
  formatTitle: (t: Translations, name: string) => string,
  fallbackSelector?: (t: Translations) => string
): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale);
  const entityName = await fetchEntityName();
  if (entityName) {
    return { title: formatTitle(t, entityName) };
  }
  return { title: fallbackSelector ? fallbackSelector(t) : formatTitle(t, "") };
}
