import type { Storage } from "@google-cloud/storage";
import { getGcpStorageClient } from "../gcp-auth";
import type { StorageService } from "../storage.service.interface";
import { GcpAdapter } from "./adapter";

export async function createGcpStorage(): Promise<Storage> {
	const storage = await getGcpStorageClient();
	return storage;
}

export async function createGcpAdapter(): Promise<StorageService> {
	const storage = await createGcpStorage();
	return new GcpAdapter(storage);
}
