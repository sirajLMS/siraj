/**
 * Types, constants, and layer definitions for scripts/unused/knip-categorize.ts.
 */

import { join } from "node:path";

// ─── Types ──────────────────────────────────────────────────────────────────

/** A single knip issue item with position info (used by most issue types). */
export interface KnipItem {
  name: string;
  line?: number;
  col?: number;
  pos?: number;
  namespace?: string;
}

/** A duplicate group — knip returns an array of arrays of items. */
export type KnipDuplicateGroup = KnipItem[];

/** Per-file issue bundle from knip JSON reporter. */
export interface KnipFileIssues {
  file: string;
  binaries: { name: string }[];
  catalog: { name: string }[];
  catalogReferences: { name: string }[];
  dependencies: KnipItem[];
  devDependencies: KnipItem[];
  duplicates: KnipDuplicateGroup[];
  enumMembers: KnipItem[];
  exports: KnipItem[];
  files: { name: string }[];
  namespaceMembers: KnipItem[];
  optionalPeerDependencies: KnipItem[];
  types: KnipItem[];
  unlisted: { name: string }[];
  unresolved: { name: string }[];
}

export interface KnipReport {
  issues: KnipFileIssues[];
}

export interface CategorizedData {
  byType: Record<string, Array<Record<string, unknown>>>;
  byLayer: Record<string, Array<Record<string, unknown>>>;
  byDirectory: Record<string, Array<Record<string, unknown>>>;
  byFile: Record<string, Record<string, number>>; // file -> { type: count }
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const PROJECT_ROOT = process.cwd();
export const OUTPUT_DIR = join(PROJECT_ROOT, ".unused");
export const RAW_OUTPUT_FILE = join(OUTPUT_DIR, "knip-results.log");

export const ALL_KNIP_TYPES = [
  "binaries",
  "catalog",
  "catalogReferences",
  "dependencies",
  "devDependencies",
  "duplicates",
  "enumMembers",
  "exports",
  "files",
  "namespaceMembers",
  "optionalPeerDependencies",
  "types",
  "unlisted",
  "unresolved",
] as const;

export type KnipType = (typeof ALL_KNIP_TYPES)[number];

/** The standard architectural layers in this project. */
export const LAYERS = ["app", "backend", "frontend", "shared", "scripts", "test"] as const;

export type Layer = (typeof LAYERS)[number];
