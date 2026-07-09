import type { StorageService } from "@/backend/storage/disk/storage.service.interface";
import { VercelAdapter } from "@/backend/storage/disk/vercel/adapter";

export function createVercelAdapter(): StorageService {
  return new VercelAdapter();
}
