import type { FileTypes } from "@/backend/enum/storage";

/**
 * Shared logic for aggregating file types and sizes into a map
 */
export function updateFileTypeMap(
  fileTypeMap: Map<FileTypes, { count: number; size: bigint }>,
  fileType: FileTypes,
  size: bigint
): void {
  const current = fileTypeMap.get(fileType) ?? {
    count: 0,
    size: BigInt(0),
  };
  fileTypeMap.set(fileType, {
    count: current.count + 1,
    size: current.size + size,
  });
}

/**
 * Shared logic for converting a file type map to the breakdown format
 */
export function formatFileTypeBreakdown(
  fileTypeMap: Map<FileTypes, { count: number; size: bigint }>
): Array<{ type: FileTypes; count: number; size: bigint }> {
  return Array.from(fileTypeMap.entries()).map(([type, data]) => ({
    type,
    count: data.count,
    size: data.size,
  }));
}

/**
 * Shared logic for calculating total files from the map
 */
export function calculateTotalFiles(fileTypeMap: Map<FileTypes, { count: number; size: bigint }>): number {
  return Array.from(fileTypeMap.values()).reduce((sum, data) => sum + data.count, 0);
}
