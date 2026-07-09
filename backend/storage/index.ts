export type { StorageService } from "./disk/storage.service.interface";
export * from "./disk/storage.service.interface";
export {
  getStorageService,
  getStorageServiceSync,
  initializeStorageService,
  resetStorageService,
} from "./storage.service";
