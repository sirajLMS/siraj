import { cachedRead } from "@/backend/services/cache";

export async function cachedParentByUserId<T>(userId: string, roleId: string, loader: () => Promise<T>): Promise<T> {
  const cacheKey = `ec:parent:byUserId:${userId}:${roleId}`;
  return cachedRead(cacheKey, 300, loader, [`parent:byUserId:${userId}`]);
}
