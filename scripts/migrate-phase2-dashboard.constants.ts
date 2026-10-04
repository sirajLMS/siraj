/**
 * Phase 2 dashboard migration constants — namespace types, combined registry
 * and legacy-key derivation.
 *
 * Extracted from `scripts/migrate-phase2-dashboard.ts`. The raw definitions
 * live in the sibling group files (`migrate-phase2-dashboard.namespaces-{a,b,c}.ts`)
 * to keep each module under the max-lines limit.
 */

import { namespacesA } from "@/scripts/migrate-phase2-dashboard.namespaces-a";
import { namespacesB } from "@/scripts/migrate-phase2-dashboard.namespaces-b";
import { namespacesC } from "@/scripts/migrate-phase2-dashboard.namespaces-c";

export interface NamespaceDef {
  readonly handle: string;
  readonly typeImport: string;
  readonly typePath: string;
  readonly enImport: string;
  readonly enExport: string;
  readonly arExport: string;
  readonly nsPath: string;
  readonly legacyKey: string;
}

export const namespaces: NamespaceDef[] = [...namespacesA, ...namespacesB, ...namespacesC];

export const legacyToHandle = new Map<string, string>();
for (const ns of namespaces) {
  legacyToHandle.set(ns.legacyKey, ns.handle);
}
legacyToHandle.set("settings.audit", "DashboardSettings");

export const sortedLegacyKeys = [...legacyToHandle.keys()].toSorted((a, b) => b.length - a.length);

export function handleToTranslationPath(handle: string): string {
  const shortName = handle.replace(/^Dashboard/, "");
  return `Translation.Dashboard.${shortName}`;
}
