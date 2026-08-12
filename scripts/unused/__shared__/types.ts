/**
 * Shared types for the knip unused-code scripts (knip-categorize, knip-analyze).
 *
 * These interfaces are produced by `knip-categorize.ts` (which writes them to
 * `.unused/summary.json` and the various by-type/by-layer JSON files) and
 * consumed by `knip-analyze.ts` (which reads the JSON back and derives
 * analysis insights). Keeping them in one place avoids drift between the
 * producer and the consumer.
 */

/** Global summary written to `.unused/summary.json` by knip-categorize. */
export interface Summary {
  totalIssues: number;
  filesAnalyzed: number;
  filesWithFindings: number;
  byType: Record<string, number>;
  byLayer: Record<string, number>;
  topDirectories: Array<{ directory: string; count: number }>;
  topFiles: Array<{ file: string; count: number }>;
  topEnumMembers: Array<Record<string, unknown>>;
  topExports: Array<Record<string, unknown>>;
  topUnusedFiles: string[];
  topDependencies: Array<Record<string, unknown>>;
  topDevDependencies: Array<Record<string, unknown>>;
  topTypes: Array<Record<string, unknown>>;
}

/** A `by-type-<type>.json` file written by knip-categorize. */
export interface TypeFile {
  type: string;
  count: number;
  issues: Array<Record<string, unknown>>;
}

/** A `by-layer-<layer>.json` file written by knip-categorize. */
export interface LayerFile {
  layer: string;
  count: number;
  issues: Array<Record<string, unknown>>;
}
