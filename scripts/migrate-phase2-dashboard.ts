#!/usr/bin/env bun
/**
 * Phase 2 dashboard namespace generator + call-site migrator.
 *
 * Implementation is split across sibling modules:
 *   • `migrate-phase2-dashboard.namespaces-{a,b,c}.ts` — raw namespace definitions
 *   • `migrate-phase2-dashboard.constants.ts`          — types, combined registry, legacy-key derivation
 *   • `migrate-phase2-dashboard.helpers.ts`            — namespace emission, call-site migration, walking
 *
 * The generated file contents and their contracts are unchanged.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { namespaces } from "@/scripts/migrate-phase2-dashboard.constants";
import { generateNamespaceFile, migrateFileContent, walkDir } from "@/scripts/migrate-phase2-dashboard.helpers";

const ROOT = join(import.meta.dir, "..");

// ─── Phase 1: Generate namespace files ──────────────────────────────────────

for (const ns of namespaces) {
  const fullPath = join(ROOT, "shared/locale/namespaces", ns.nsPath);
  const dir = dirname(fullPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(fullPath, generateNamespaceFile(ns));
}
console.log(`Created ${namespaces.length} namespace files`);

// ─── Phase 2: Migrate call-site files ───────────────────────────────────────

let migratedFiles = 0;
for (const dir of [join(ROOT, "frontend"), join(ROOT, "app")]) {
  for (const file of walkDir(dir)) {
    const content = readFileSync(file, "utf-8");
    if (!content.includes("dashboardTranslations.")) continue;
    const { content: newContent, changed } = migrateFileContent(content);
    if (changed) {
      writeFileSync(file, newContent);
      migratedFiles++;
    }
  }
}
console.log(`Migrated ${migratedFiles} call-site files`);

// ─── Phase 3: Update namespaces/index.ts ────────────────────────────────────

const indexPath = join(ROOT, "shared/locale/namespaces/index.ts");
let indexContent = readFileSync(indexPath, "utf-8");
for (const ns of namespaces) {
  const importLine = `export { ${ns.handle} } from "@/shared/locale/namespaces/${ns.nsPath.replace(/\.ts$/, "")}";`;
  if (!indexContent.includes(ns.handle)) {
    indexContent = indexContent.replace(/export \{\s*defineNamespace,/, `${importLine}\nexport {\n  defineNamespace,`);
  }
}
writeFileSync(indexPath, indexContent);
console.log("Updated namespaces/index.ts");

// ─── Phase 4: Update translation.ts ─────────────────────────────────────────

const translationPath = join(ROOT, "shared/locale/namespaces/translation.ts");
let translationContent = readFileSync(translationPath, "utf-8");
for (const ns of namespaces) {
  const shortName = ns.handle.replace(/^Dashboard/, "");
  const importLine = `import { ${ns.handle} } from "@/shared/locale/namespaces/${ns.nsPath.replace(/\.ts$/, "")}";`;
  if (!translationContent.includes(ns.handle)) {
    translationContent = translationContent.replace(
      /export const Translation = \{/,
      `${importLine}\nexport const Translation = {`
    );
    translationContent = translationContent.replace(
      /CoreParentDashboard: DashboardCoreParentDashboard,\n {2}\},/,
      `CoreParentDashboard: DashboardCoreParentDashboard,\n    ${shortName}: ${ns.handle},\n  },`
    );
  }
}
writeFileSync(translationPath, translationContent);
console.log("Updated translation.ts");
