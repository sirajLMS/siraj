export function isAuditMetadataRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readAuditMetadataKey(metadata: unknown): string | null {
  if (!isAuditMetadataRecord(metadata)) return null;
  const key = metadata.idempotencyKey;
  return typeof key === "string" ? key : null;
}
