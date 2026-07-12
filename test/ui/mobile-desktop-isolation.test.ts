import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

/**
 * ESLint boundary rule verification for the mobile/desktop isolation architecture.
 * These tests replicate, at the runtime level, what the `no-restricted-imports` ESLint
 * rules in `eslint.config.mjs` enforce statically:
 *
 *  - `.mobile.tsx` files must NOT import any `.desktop` file (and vice versa).
 *  - `.mobile.tsx` and `.desktop.tsx` files must NOT import `useMediaQuery` from `@mui/material`.
 *
 * They act as a safety net so a broken ESLint config, a misconfigured glob, or an
 * editor that bypassed linting cannot silently let a violating import slip through.
 * Scanning is restricted to `frontend/views/` per the plan (Phase 6, lines 634-636).
 */

const VIEWS_ROOT = resolve(import.meta.dirname, "../../frontend/views");

const FORBIDDEN_USE_MEDIA_QUERY = /\buseMediaQuery\b/;
const FROM_DESKTOP = /\.desktop\b/;
const FROM_MOBILE = /\.mobile\b/;
// Match `import ... from "...x.desktop"` (optional extension) without enabling
// catastrophic backtracking — anchored, no nested quantifiers.
const IMPORT_FROM_DESKTOP = /import\s[^;\n]*?from\s*['"][^'"]*\.desktop(?:\.tsx?)?['"]/;
const IMPORT_FROM_MOBILE = /import\s[^;\n]*?from\s*['"][^'"]*\.mobile(?:\.tsx?)?['"]/;
// Strip JSDoc/block comments and line comments before scanning for forbidden tokens.
// This prevents false positives when `useMediaQuery` appears in a docstring, not an import.
const COMMENT_BLOCK = /\/\*[\s\S]*?\*\//g;
const COMMENT_LINE = /^[ \t]*\/\/.*$/gm;

interface VersionedFile {
  readonly path: string;
  readonly tier: "mobile" | "desktop";
  readonly source: string;
}

function isVersioned(fileName: string): "mobile" | "desktop" | null {
  if (fileName.endsWith(".mobile.tsx") || fileName.endsWith(".mobile.ts")) return "mobile";
  if (fileName.endsWith(".desktop.tsx") || fileName.endsWith(".desktop.ts")) return "desktop";
  return null;
}

function walkDir(dir: string, collected: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkDir(full, collected);
    } else if (stat.isFile() && isVersioned(entry) !== null) {
      collected.push(full);
    }
  }
}

function collectVersionedFiles(): VersionedFile[] {
  const files: VersionedFile[] = [];
  const rawPaths: string[] = [];
  walkDir(VIEWS_ROOT, rawPaths);
  for (const path of rawPaths) {
    const tier = isVersioned(path);
    if (tier === null) continue;
    const rawSource = readFileSync(path, "utf8");
    // Strip comments before scanning so docstrings mentioning forbidden tokens
    // (e.g., "Must NEVER import useMediaQuery") don't trigger false positives.
    const source = rawSource.replace(COMMENT_BLOCK, "").replace(COMMENT_LINE, "");
    files.push({ path: relative(resolve(import.meta.dirname, "../.."), path), tier, source });
  }
  return files;
}

const versionedFiles = collectVersionedFiles();
const mobileFiles = versionedFiles.filter(f => f.tier === "mobile");
const desktopFiles = versionedFiles.filter(f => f.tier === "desktop");

function findTierImportViolators(files: readonly VersionedFile[], forbiddenImport: RegExp): string[] {
  const violators: string[] = [];
  for (const file of files) {
    const matches = forbiddenImport.exec(file.source);
    if (matches) {
      violators.push(`${file.path} -> ${matches[0].trim()}`);
    }
  }
  return violators;
}

describe("mobile/desktop isolation: cross-tier imports", () => {
  test("mobile files do not import desktop files", () => {
    expect(findTierImportViolators(mobileFiles, IMPORT_FROM_DESKTOP)).toEqual([]);
  });

  test("desktop files do not import mobile files", () => {
    expect(findTierImportViolators(desktopFiles, IMPORT_FROM_MOBILE)).toEqual([]);
  });

  test(".mobile / .desktop suffixes are not referenced anywhere in the opposite tier's source", () => {
    const mobileViolations: string[] = [];
    for (const file of mobileFiles) {
      if (FROM_DESKTOP.exec(file.source)) {
        mobileViolations.push(file.path);
      }
    }
    const desktopViolations: string[] = [];
    for (const file of desktopFiles) {
      if (FROM_MOBILE.exec(file.source)) {
        desktopViolations.push(file.path);
      }
    }
    expect({ mobileReferencingDesktop: mobileViolations, desktopReferencingMobile: desktopViolations }).toEqual({
      mobileReferencingDesktop: [],
      desktopReferencingMobile: [],
    });
  });
});

describe("mobile/desktop isolation: useMediaQuery", () => {
  test("no versioned file imports useMediaQuery from @mui/material", () => {
    const violators: string[] = [];
    for (const file of versionedFiles) {
      if (FORBIDDEN_USE_MEDIA_QUERY.exec(file.source)) {
        const offendingLine = file.source.split("\n").find(line => FORBIDDEN_USE_MEDIA_QUERY.exec(line));
        violators.push(`${file.path}: ${offendingLine?.trim() ?? "(useMediaQuery detected)"}`);
      }
    }
    expect(violators).toEqual([]);
  });
});

describe("mobile/desktop isolation: smoke checks (sanity)", () => {
  test("discovers at least one mobile versioned file under frontend/views", () => {
    expect(mobileFiles.length).toBeGreaterThan(0);
  });

  test("discovers at least one desktop versioned file under frontend/views", () => {
    expect(desktopFiles.length).toBeGreaterThan(0);
  });

  test("no versioned file is counted twice", () => {
    const paths = versionedFiles.map(f => f.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
