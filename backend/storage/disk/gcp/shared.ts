import type { GcpContext } from "./types";

export async function getFolderFileCounts(
	ctx: GcpContext,
	prefixes: string[],
	dirPaths: string[],
): Promise<Map<string, number>> {
	const folderFileCountMap = new Map<string, number>();

	if (prefixes.length === 0) {
		return folderFileCountMap;
	}

	const folderCountPromises = dirPaths.map(async (dirPath) => {
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

export async function getValidSourcePaths(
	ctx: GcpContext,
	sourcePaths: string[],
): Promise<{
	validSources: string[];
	failureCount: number;
	failures: Array<{ path: string; error: string }>;
}> {
	const existenceChecks = await Promise.all(
		sourcePaths.map(async (path) => {
			const [exists] = await ctx.bucket.file(path).exists();
			return { path, exists };
		}),
	);

	const validSources: string[] = [];
	const failures: Array<{ path: string; error: string }> = [];
	let failureCount = 0;

	for (const check of existenceChecks) {
		if (check.exists) {
			validSources.push(check.path);
		} else {
			failureCount++;
			failures.push({ path: check.path, error: "Source path not found" });
		}
	}

	return { validSources, failureCount, failures };
}
