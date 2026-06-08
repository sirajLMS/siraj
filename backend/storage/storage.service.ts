import logger from "@/backend/lib/logger";
import { createGcpAdapter } from "./disk/gcp";
import { createLocalAdapter } from "./disk/local";
import type { StorageService } from "./disk/storage.service.interface";
import { createVercelAdapter } from "./disk/vercel";

/**
 * Supported storage providers
 */
type StorageProvider = "gcp" | "local" | "vercel" | "s3" | "r2";

// Module-level state replaces the static class properties
let instance: StorageService | null = null;
let initializationPromise: Promise<StorageService> | null = null;

/**
 * Get the storage provider from environment variable
 */
function getStorageProvider(): StorageProvider {
	const provider = process.env.STORAGE_PROVIDER;

	const validProviders: StorageProvider[] = [
		"gcp",
		"local",
		"vercel",
		"s3",
		"r2",
	];
	if (!validProviders.includes(provider)) {
		throw new Error(
			`Invalid STORAGE_PROVIDER: ${provider}. Options: ${validProviders.join(", ")}`,
		);
	}

	return provider;
}

/**
 * Create storage service instance based on provider
 */
async function createService(
	provider: StorageProvider,
): Promise<StorageService> {
	switch (provider) {
		case "gcp":
			return await createGcpAdapter();

		case "local":
			return await createLocalAdapter();

		case "vercel":
			return createVercelAdapter();

		case "s3":
			throw new Error("S3 storage adapter not implemented yet");

		case "r2":
			throw new Error("R2 storage adapter not implemented yet");

		default:
			throw new Error(`Unsupported storage provider: ${provider}`);
	}
}

/**
 * Get the configured storage service instance (singleton pattern)
 * This is the main export that should be used throughout the application
 */
export const getStorageService = async (): Promise<StorageService> => {
	// If already fully initialized, return the instance immediately
	if (instance) {
		return instance;
	}

	// If an initialization is already in progress, await its promise
	// rather than creating a busy-wait loop.
	if (!initializationPromise) {
		initializationPromise = (async () => {
			try {
				const provider = getStorageProvider();
				const service = await createService(provider);

				instance = service;
				logger.info(`Storage service initialized with provider: ${provider}`);

				return instance;
			} catch (error) {
				// Reset promise on failure so subsequent calls can try again
				initializationPromise = null;
				logger.error("Failed to initialize storage service", error);
				throw new Error(
					`Failed to initialize storage service: ${error instanceof Error ? error.message : String(error)}`,
					{ cause: error },
				);
			}
		})();
	}

	return initializationPromise;
};

/**
 * Get storage service synchronously (throws if not initialized)
 * Use this only when you're certain the service has been initialized
 */
export const getStorageServiceSync = (): StorageService => {
	if (!instance) {
		throw new Error(
			"Storage service not initialized. Call getStorageService() first.",
		);
	}
	return instance;
};

/**
 * Initialize storage service (optional, useful for app startup)
 * The service will be automatically initialized on first use if not called explicitly
 */
export const initializeStorageService = async (): Promise<StorageService> => {
	return await getStorageService();
};

/**
 * Reset the singleton instance (useful for testing)
 */
export const resetStorageService = (): void => {
	instance = null;
	initializationPromise = null;
};

export * from "../types/storage.types";
export * from "./disk/storage.service.interface";
// Re-export types for convenience
export type { StorageService };
