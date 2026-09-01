import type { GcpContext } from "@/backend/storage/disk/gcp/types";

export async function getFolderFileCounts(
  ctx: GcpContext,
  prefixes: string[],
  dirPaths: string[]
): Promise<Map<string, number>> {
  const folderFileCountMap = new Map<string, number>();

  if (prefixes.length === 0) {
    return folderFileCountMap;
  }

  const folderCountPromises = dirPaths.map(async dirPath => {
    const dirPrefix = `${dirPath}/`;
    const [folderFiles] = await ctx.bucket.getFiles({
      prefix: dirPrefix,
    });
    return { dirPath, count: folderFiles.length };
  });

  const folderCounts = await Promise.all(folderCountPromises);
  for (const { dirPath, count } of folderCounts) {
    folderFileCountMap.set(dirPath, count);
  }

  return folderFileCountMap;
}
