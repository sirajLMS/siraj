import fs from "node:fs/promises";
import path from "node:path";
import type { StorageService } from "../storage.service.interface";
import { LocalAdapter } from "./adapter";

export async function createLocalAdapter(): Promise<StorageService> {
	const isServerless =
		!!process.env.VERCEL ||
		!!process.env.NETLIFY ||
		!!process.env.AWS_LAMBDA_FUNCTION_NAME ||
		!!process.env.K_SERVICE ||
		!!process.env.FUNCTION_TARGET ||
		!!process.env.FUNCTIONS_WORKER_RUNTIME ||
		!!process.env.CF_PAGES ||
		!!process.env.RAILWAY_ENVIRONMENT;

	if (isServerless) {
		const detectedEnvs = Object.keys(process.env).filter((k) =>
			[
				"VERCEL",
				"NETLIFY",
				"AWS_LAMBDA_FUNCTION_NAME",
				"K_SERVICE",
				"FUNCTION_TARGET",
				"FUNCTIONS_WORKER_RUNTIME",
				"CF_PAGES",
				"RAILWAY_ENVIRONMENT",
			].includes(k),
		);

		throw new Error(
			"FATAL: The 'local' storage provider is enabled in a serverless environment. " +
				"This is not supported and will lead to data loss. " +
				"Use a compatible cloud provider (e.g., 'gcp', 's3') in your environment configuration. " +
				`Detected environment: ${detectedEnvs.join(", ")}`,
		);
	}

	const storagePath = process.env.LOCAL_STORAGE_PATH || "./storage/";
	const fullPath = path.resolve(process.cwd(), storagePath);
	await fs.mkdir(fullPath, { recursive: true, mode: 0o755 });

	return new LocalAdapter();
}
