export type DocumentAvailability = "checking" | "available" | "unavailable";

export function resolveDocumentAvailability(
  src: string | null,
  checkedSrc: string | null,
  status: DocumentAvailability
): DocumentAvailability {
  if (src === null) return "unavailable";
  if (checkedSrc !== src) return "checking";
  return status;
}
