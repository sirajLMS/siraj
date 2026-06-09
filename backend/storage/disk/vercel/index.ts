import type { StorageService } from "../storage.service.interface";
import { VercelAdapter } from "./adapter";

export function createVercelAdapter(): StorageService {
  return new VercelAdapter();
}
