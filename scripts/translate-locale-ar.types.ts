export type EntryKind = "string" | "function" | "reference";

/** A single flattened locale entry extracted from a leaf module. */
export interface LocaleEntry {
  /** Dotted key path, e.g. `table.student`. */
  key: string;
  kind: EntryKind;
  /** Exact source slice from the file (for strings: the quoted literal;
   *  for functions: the full arrow-function source). */
  source: string;
}

export type EntryStatus = "unchanged" | "changed" | "invalid" | "error";

/** One reviewed entry in the report. */
export interface ReportEntry {
  key: string;
  kind: EntryKind;
  /** English source text (decoded string) or English function source. */
  en: string;
  /** Current Arabic value (decoded string) or current function source. */
  current: string;
  /** Exact raw source slice in the current ar file — use as Edit old_string. */
  currentSource: string;
  /** Model proposal (decoded string) or proposed function source. */
  proposed: string;
  status: EntryStatus;
  notes: string[];
}

/** Per-file report. */
export interface FileReport {
  arFile: string;
  enFile: string;
  timestamp: string;
  model: string;
  entries: ReportEntry[];
  stats: Record<EntryStatus, number>;
}

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}
