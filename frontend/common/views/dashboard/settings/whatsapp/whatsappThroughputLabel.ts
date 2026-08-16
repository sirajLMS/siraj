const THROUGHPUT_LABEL_KEYS: Readonly<Record<string, string>> = {
  STANDARD: "throughputStandard",
  COEXISTENCE: "throughputCoexistence",
  HIGH: "throughputHigh",
  UNKNOWN: "throughputUnknown",
} as const;

export function getThroughputLabelKey(level: string): string {
  return THROUGHPUT_LABEL_KEYS[level?.toUpperCase() ?? ""] ?? "throughputUnknown";
}
