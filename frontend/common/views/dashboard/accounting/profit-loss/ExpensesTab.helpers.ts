/** Resolves the aggregate's per-type tally to verified string→number pairs. */
export function toTypeTallies(rowCountByType: unknown): [string, number][] {
  if (typeof rowCountByType !== "object" || rowCountByType === null) return [];
  return Object.entries(rowCountByType).filter((entry): entry is [string, number] => typeof entry[1] === "number");
}
