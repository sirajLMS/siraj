import { cachedRead } from "@/backend/services/cache";

export async function cachedTeacherByUserId<T>(userId: string, roleId: string, loader: () => Promise<T>): Promise<T> {
  const cacheKey = `ec:teacher:byUserId:${userId}:${roleId}`;
  return cachedRead(cacheKey, 300, loader, [`teacher:byUserId:${userId}`]);
}
