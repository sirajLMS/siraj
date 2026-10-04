/**
 * Phase 2 dashboard migration helpers — namespace file emission, call-site
 * content migration and directory walking.
 *
 * Extracted from `scripts/migrate-phase2-dashboard.ts`. Pure string/file
 * transforms used by the migration phases in the main script.
 */

import { readdirSync } from "node:fs";
import { join } from "node:path";
import {
  handleToTranslationPath,
  legacyToHandle,
  type NamespaceDef,
  sortedLegacyKeys,
} from "@/scripts/migrate-phase2-dashboard.constants";

export function generateNamespaceFile(ns: NamespaceDef): string {
  return `import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ${ns.typeImport} } from "@/shared/locale/types/${ns.typePath}";

export const ${ns.handle} = defineNamespace<${ns.typeImport}>({
  load: {
    en: () => import("@/shared/locale/en/${ns.enImport}").then(module => module.${ns.enExport}),
    ar: () => import("@/shared/locale/ar/${ns.enImport}").then(module => module.${ns.arExport}),
  },
});
`;
}

export function ensureTranslationImport(content: string): string {
  if (!content.includes("Translation.Dashboard.")) return content;
  if (/import\s*\{[^}]*\bTranslation\b/.test(content)) return content;

  const localeImport = /import\s*\{([^}]+)\}\s*from\s*"@\/shared\/locale";?/;
  const match = localeImport.exec(content);
  if (match) {
    const imports = match[1].trim();
    const newImports = imports.includes("Translation") ? imports : `${imports}, Translation`;
    return content.replace(localeImport, `import { ${newImports} } from "@/shared/locale";`);
  }

  const clientImport = /import\s*\{([^}]+)\}\s*from\s*"@\/shared\/locale\/client";?/;
  const clientMatch = clientImport.exec(content);
  if (clientMatch) {
    const imports = clientMatch[1].trim();
    const newImports = imports.includes("Translation") ? imports : `${imports}, Translation`;
    return content.replace(clientImport, `import { ${newImports} } from "@/shared/locale/client";`);
  }

  if (content.startsWith('"use client";')) {
    return content.replace(
      /^"use client";\n/,
      `"use client";\n\nimport { Translation, useAppTranslation } from "@/shared/locale";\n`
    );
  }

  return `import { Translation } from "@/shared/locale";\n${content}`;
}

export function migrateFileContent(content: string): { content: string; changed: boolean } {
  let result = content;
  let changed = false;

  for (const legacyKey of sortedLegacyKeys) {
    const handle = legacyToHandle.get(legacyKey);
    if (!handle) {
      continue;
    }
    const fullPath = handleToTranslationPath(handle);
    const escaped = legacyKey.replace(/\./g, "\\.");

    const p1 = new RegExp(`useAppTranslation\\(\\)\\.dashboardTranslations\\.${escaped}((?:\\.\\w+)*)`, "g");
    const c1 = result.replace(p1, `useAppTranslation(${fullPath})$1`);
    if (c1 !== result) {
      result = c1;
      changed = true;
    }

    const p2 = new RegExp(`\\.dashboardTranslations\\.${escaped}((?:\\.\\w+)*)`, "g");
    const c2 = result.replace(p2, (_m, suffix: string) => `__MIGRATE_${handle}__${suffix}`);
    if (c2 !== result) {
      result = c2;
      changed = true;
    }
  }

  const migrateMarker = /__MIGRATE_(Dashboard\w+)__((?:\.\w+)*)/g;
  const c3 = result.replace(migrateMarker, (_m, handle: string, suffix: string) => {
    const fullPath = handleToTranslationPath(handle);
    return `useAppTranslation(${fullPath})${suffix}`;
  });
  if (c3 !== result) {
    result = c3;
    changed = true;
  }

  if (changed) {
    result = ensureTranslationImport(result);
  }

  return { content: result, changed };
}

export function walkDir(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      files.push(...walkDir(full));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}
