export function toAuditStartDateIso(dateStr: string): string | null {
  if (!dateStr) {
    return null;
  }

  return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}

export function toAuditEndDateIso(dateStr: string): string | null {
  if (!dateStr) {
    return null;
  }

  return new Date(`${dateStr}T23:59:59.999Z`).toISOString();
}
