export function formatDate(dateStr: string | null | undefined): string {
  if (dateStr == null || dateStr.length === 0) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

export function formatDelta(delta: number | null): string {
  if (delta == null) return "";
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}
