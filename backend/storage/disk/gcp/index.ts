import type { Storage } from "@google-cloud/storage";
import { GcpAdapter } from "@/backend/storage/disk/gcp/adapter";
import { getGcpStorageClient } from "@/backend/storage/disk/gcp-auth";
import type { StorageService } from "@/backend/storage/disk/storage.service.interface";

async function createGcpStorage(): Promise<Storage> {
  const storage = await getGcpStorageClient();
  return storage;
}

export async function createGcpAdapter(): Promise<StorageService> {
  const storage = await createGcpStorage();
  return new GcpAdapter(storage);
}
